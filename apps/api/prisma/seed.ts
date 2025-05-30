import { PrismaClient, QuestionType, FagCategory } from '@prisma/client';
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
  const seedpensumPath = path.join(__dirname, '../../..', 'Seedpensum.txt');
  return fs.readFileSync(seedpensumPath, 'utf-8');
}

// Function to parse the Seedpensum.txt content
function parseSeedpensum(content: string): Record<string, string[]> {
  const lines = content.split('\n');
  const semesters: Record<string, string[]> = {};
  
  let currentSemester = '';
  let currentTopicName = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) continue;
    
    // Check if line is a semester header
    if (trimmedLine.match(/^\d+\.\s*semester$/)) {
      currentSemester = trimmedLine;
      semesters[currentSemester] = [];
      currentTopicName = '';
    } 
    // Check if line is a topic header
    else if (trimmedLine.match(/^[A-Za-zæøåÆØÅ\s]+$/) && !trimmedLine.startsWith('•')) {
      currentTopicName = trimmedLine;
      if (currentSemester) {
        if (!semesters[currentSemester].includes(currentTopicName)) {
          semesters[currentSemester].push(currentTopicName);
        }
      }
    }
    // Check if line is a lesson (bullet point)
    else if (trimmedLine.startsWith('•')) {
      // We don't need to store lessons here, just topics
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
    const semestersAndTopics = parseSeedpensum(seedpensumContent);
    
    // Create 2 education programs
    const educationProgramsData = [
      {
        name: 'Laborant Uddannelse',
        slug: 'laborant-uddannelse',
      },
      {
        name: 'Kemiteknologi',
        slug: 'kemiteknologi',
      },
    ];
    
    console.log('Creating education programs...');
    const createdEducationPrograms = await Promise.all(
      educationProgramsData.map(async (programData) => {
        return prisma.educationProgram.upsert({
          where: { slug: programData.slug },
          update: programData,
          create: programData,
        });
      })
    );
    
    // Create 3 courses (one for each semester)
    const semesterKeys = Object.keys(semestersAndTopics).slice(0, 3); // Get first 3 semesters
    
    console.log('Creating courses...');
    const createdCourses = await Promise.all(
      semesterKeys.map(async (semesterKey, index) => {
        const educationProgramId = createdEducationPrograms[index % 2].id;
        const semesterNumberMatch = semesterKey.match(/^(\d+)/);
        const semesterNumber = semesterNumberMatch ? parseInt(semesterNumberMatch[1]) : index + 1;

        const course = {
          title: semesterKey,
          description: `Course for ${semesterKey}`,
          slug: generateSlug(semesterKey),
          educationProgramId,
          semesterNumber,
        };
        
        return prisma.course.upsert({
          where: { slug: course.slug },
          update: course,
          create: course,
        });
      })
    );
    
    // Create topics for each course
    console.log('Creating topics...');
    for (let i = 0; i < createdCourses.length; i++) {
      const course = createdCourses[i];
      const semesterKey = semesterKeys[i];
      const topicNames = semestersAndTopics[semesterKey];
      
      await Promise.all(
        topicNames.map(async (topicName, topicIndex) => {
          const topicData = {
            title: topicName,
            description: `Topic for ${topicName}`,
            order: topicIndex + 1,
            courseId: course.id,
            subjectCategory: FagCategory.ANDET,
          };
          
          const createdTopic = await prisma.topic.create({
            data: topicData,
          });
          
          // Create a lesson for each topic
          const lessonData = {
            title: `Introduction to ${topicName}`,
            description: `Lesson for ${topicName}`,
            order: 1,
            topicId: createdTopic.id,
          };
          
          const createdLesson = await prisma.lesson.create({
            data: lessonData,
          });
          
          // Create a content block for each lesson
          await prisma.contentBlock.create({
            data: {
              type: 'TEXT',
              content: `This is an introduction to ${topicName}. The content is based on the curriculum from Seedpensum.txt.`,
              order: 1,
              lessonId: createdLesson.id,
            },
          });
        })
      );
    }
    
    // Create 10 quizzes
     console.log('Creating quizzes...');
     const topicsForQuizzes = await prisma.topic.findMany({
       take: 10,
     });
 
     await Promise.all(
       topicsForQuizzes.map(async (topic, index) => {
         const quizData = {
           title: `Quiz ${index + 1} - ${topic.title}`,
           description: `Test your knowledge of ${topic.title}`,
           topicId: topic.id,
         };
         
         const createdQuiz = await prisma.quiz.create({
           data: quizData,
         });
         
         // Create 3 questions for each quiz
         for (let i = 0; i < 3; i++) {
           const questionData = {
             text: `Question ${i + 1} for ${topic.title}`,
             type: QuestionType.MULTIPLE_CHOICE,
             quizId: createdQuiz.id,
           };
           
           const createdQuestion = await prisma.question.create({
             data: questionData,
           });
           
           // Create 4 answer options for each question
           const answerOptions = [
             {
               text: 'Answer option 1',
               isCorrect: i === 0,
               questionId: createdQuestion.id,
             },
             {
               text: 'Answer option 2',
               isCorrect: i === 1,
               questionId: createdQuestion.id,
             },
             {
               text: 'Answer option 3',
               isCorrect: i === 2,
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
               await prisma.answerOption.create({
                 data: option,
               });
             })
           );
         }
       })
     );
    
    console.log('Seed completed successfully!');
     console.log('Created education programs, courses, topics, lessons, content blocks, and quizzes.');
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