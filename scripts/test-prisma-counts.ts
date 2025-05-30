import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCounts() {
  console.log('Testing Prisma Client counts...');
  try {
    const userCount = await prisma.user.count();
    console.log(`User count: ${userCount}`);

    const educationProgramCount = await prisma.educationProgram.count();
    console.log(`EducationProgram count: ${educationProgramCount}`);

    const courseCount = await prisma.course.count();
    console.log(`Course count: ${courseCount}`);

    const topicCount = await prisma.topic.count();
    console.log(`Topic count: ${topicCount}`);

    const lessonCount = await prisma.lesson.count();
    console.log(`Lesson count: ${lessonCount}`);

    const contentBlockCount = await prisma.contentBlock.count();
    console.log(`ContentBlock count: ${contentBlockCount}`);

    const quizCount = await prisma.quiz.count();
    console.log(`Quiz count: ${quizCount}`);

    const questionCount = await prisma.question.count();
    console.log(`Question count: ${questionCount}`);

    console.log('All counts successful!');
  } catch (error) {
    console.error('Error during prisma.model.count():', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCounts(); 