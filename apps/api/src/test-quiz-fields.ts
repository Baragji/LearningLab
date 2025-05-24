import { PrismaClient } from '@prisma/client';

async function testQuizFields() {
  console.log('Testing Quiz model with new fields...');

  // Create a new Prisma client
  const prisma = new PrismaClient();

  try {
    // Find a module to attach the quiz to
    const module = await prisma.module.findFirst({
      where: { deletedAt: null },
    });

    if (!module) {
      console.log(
        'No modules found to test with. Please create a module first.',
      );
      return;
    }

    // Create a test quiz with the new fields
    const quiz = await prisma.quiz.create({
      data: {
        title: 'Test Quiz with New Fields',
        description:
          'Testing timeLimit, maxAttempts, randomizeQuestions, and showAnswers fields',
        moduleId: module.id,
        timeLimit: 600, // 10 minutes in seconds
        maxAttempts: 3,
        randomizeQuestions: true,
        showAnswers: false,
      },
    });

    console.log('Successfully created quiz with new fields:');
    console.log(JSON.stringify(quiz, null, 2));

    // Retrieve the quiz to verify the fields were saved correctly
    const retrievedQuiz = await prisma.quiz.findUnique({
      where: { id: quiz.id },
    });

    console.log('Retrieved quiz:');
    console.log(JSON.stringify(retrievedQuiz, null, 2));

    // Clean up - delete the test quiz
    await prisma.quiz.delete({
      where: { id: quiz.id },
    });

    console.log('Quiz model with new fields tested successfully!');
  } catch (error) {
    console.error('Error testing Quiz model:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQuizFields()
  .then(() => console.log('Test completed'))
  .catch((error) => console.error('Test failed:', error));
