import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Function to generate a slug from a string
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

// Function to read the Seedpensum.txt file
function readSeedpensum(): string {
  const seedpensumPath = path.join(__dirname, '../../../..', 'Seedpensum.txt');
  return fs.readFileSync(seedpensumPath, 'utf-8');
}

// Function to parse the Seedpensum.txt content
function parseSeedpensum(content: string): Record<string, string[]> {
  const lines = content.split('\n');
  const semesters: Record<string, string[]> = {};
  
  let currentSemester = '';
  let currentModule = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) continue;
    
    // Check if line is a semester header
    if (trimmedLine.match(/^\d+\.\s*semester$/)) {
      currentSemester = trimmedLine;
      semesters[currentSemester] = [];
      currentModule = '';
    } 
    // Check if line is a module header
    else if (trimmedLine.match(/^[A-Za-zæøåÆØÅ\s]+$/) && !trimmedLine.startsWith('•')) {
      currentModule = trimmedLine;
      if (currentSemester) {
        if (!semesters[currentSemester].includes(currentModule)) {
          semesters[currentSemester].push(currentModule);
        }
      }
    }
    // Check if line is a lesson (bullet point)
    else if (trimmedLine.startsWith('•')) {
      // We don't need to store lessons here, just modules
      continue;
    }
  }
  
  return semesters;
}

// Main seed function
async function seed() {
  try {
    console.log('Starting seed process...');
    
    // Read and parse Seedpensum.txt
    const seedpensumContent = readSeedpensum();
    const semesters = parseSeedpensum(seedpensumContent);
    
    // Create 2 subject areas
    const subjectAreas = [
      {
        name: 'Laborant Uddannelse',
        slug: 'laborant-uddannelse',
      },
      {
        name: 'Kemiteknologi',
        slug: 'kemiteknologi',
      },
    ];
    
    console.log('Creating subject areas...');
    const createdSubjectAreas = await Promise.all(
      subjectAreas.map(async (subjectArea) => {
        return prisma.subjectArea.upsert({
          where: { slug: subjectArea.slug },
          update: subjectArea,
          create: subjectArea,
        });
      })
    );
    
    // Create 3 courses (one for each semester)
    const semesterKeys = Object.keys(semesters).slice(0, 3); // Get first 3 semesters
    
    console.log('Creating courses...');
    const createdCourses = await Promise.all(
      semesterKeys.map(async (semesterKey, index) => {
        const subjectAreaId = createdSubjectAreas[index % 2].id; // Alternate between subject areas
        
        const course = {
          title: semesterKey,
          description: `Course for ${semesterKey}`,
          slug: generateSlug(semesterKey),
          subjectAreaId,
        };
        
        return prisma.course.upsert({
          where: { slug: course.slug },
          update: course,
          create: course,
        });
      })
    );
    
    // Create modules for each course
    console.log('Creating modules...');
    for (let i = 0; i < createdCourses.length; i++) {
      const course = createdCourses[i];
      const semesterKey = semesterKeys[i];
      const modules = semesters[semesterKey];
      
      await Promise.all(
        modules.map(async (moduleName, moduleIndex) => {
          const moduleData = {
            title: moduleName,
            description: `Module for ${moduleName}`,
            order: moduleIndex + 1,
            courseId: course.id,
          };
          
          const createdModule = await prisma.module.upsert({
            where: {
              id: -1, // This will always fail, forcing an insert
            },
            update: moduleData,
            create: moduleData,
          });
          
          // Create a lesson for each module
          const lessonData = {
            title: `Introduction to ${moduleName}`,
            description: `Lesson for ${moduleName}`,
            order: 1,
            moduleId: createdModule.id,
          };
          
          const createdLesson = await prisma.lesson.upsert({
            where: {
              id: -1, // This will always fail, forcing an insert
            },
            update: lessonData,
            create: lessonData,
          });
          
          // Create a content block for the lesson
          await prisma.contentBlock.upsert({
            where: {
              id: -1, // This will always fail, forcing an insert
            },
            update: {
              type: 'TEXT',
              content: `This is an introduction to ${moduleName}. The content is based on the curriculum from Seedpensum.txt.`,
              order: 1,
              lessonId: createdLesson.id,
            },
            create: {
              type: 'TEXT',
              content: `This is an introduction to ${moduleName}. The content is based on the curriculum from Seedpensum.txt.`,
              order: 1,
              lessonId: createdLesson.id,
            },
          });
        })
      );
    }
    
    // Create 10 quizzes
    console.log('Creating quizzes...');
    const modules = await prisma.module.findMany({
      take: 10,
    });
    
    await Promise.all(
      modules.map(async (module, index) => {
        const quizData = {
          title: `Quiz ${index + 1} - ${module.title}`,
          description: `Test your knowledge of ${module.title}`,
          moduleId: module.id,
        };
        
        const createdQuiz = await prisma.quiz.upsert({
          where: {
            id: -1, // This will always fail, forcing an insert
          },
          update: quizData,
          create: quizData,
        });
        
        // Create 3 questions for each quiz
        for (let i = 0; i < 3; i++) {
          const questionData = {
            text: `Question ${i + 1} for ${module.title}`,
            type: 'MULTIPLE_CHOICE',
            quizId: createdQuiz.id,
          };
          
          const createdQuestion = await prisma.question.upsert({
            where: {
              id: -1, // This will always fail, forcing an insert
            },
            update: questionData,
            create: questionData,
          });
          
          // Create 4 answer options for each question
          const answerOptions = [
            {
              text: 'Answer option 1',
              isCorrect: i === 0, // First option is correct for first question
              questionId: createdQuestion.id,
            },
            {
              text: 'Answer option 2',
              isCorrect: i === 1, // Second option is correct for second question
              questionId: createdQuestion.id,
            },
            {
              text: 'Answer option 3',
              isCorrect: i === 2, // Third option is correct for third question
              questionId: createdQuestion.id,
            },
            {
              text: 'Answer option 4',
              isCorrect: false,
              questionId: createdQuestion.id,
            },
          ];
          
          await Promise.all(
            answerOptions.map(async (option) => {
              await prisma.answerOption.upsert({
                where: {
                  id: -1, // This will always fail, forcing an insert
                },
                update: option,
                create: option,
              });
            })
          );
        }
      })
    );
    
    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Error during seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the seed function
seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });