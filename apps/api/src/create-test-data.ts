import { PrismaClient, Role } from '@prisma/client';

async function createTestData() {
  console.log('Creating test data...');

  const prisma = new PrismaClient();

  try {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hashed_password_here',
        name: 'Test User',
        role: Role.ADMIN,
      },
    });

    console.log('Created test user:', user.id);

    // Create a test education program
    const educationProgram = await prisma.educationProgram.create({
      data: {
        name: 'Test Education Program',
        slug: 'test-education-program',
        description: 'A test education program for testing purposes',
        createdBy: user.id,
      },
    });

    console.log('Created test education program:', educationProgram.id);

    // Create a test course
    const course = await prisma.course.create({
      data: {
        title: 'Test Course',
        description: 'A test course for testing purposes',
        slug: 'test-course',
        educationProgramId: educationProgram.id,
        createdBy: user.id,
      },
    });

    console.log('Created test course:', course.id);

    // Create a test topic
    const topic = await prisma.topic.create({
      data: {
        title: 'Test Topic',
        description: 'A test topic for testing purposes',
        order: 1,
        courseId: course.id,
        createdBy: user.id,
      },
    });

    console.log('Created test topic:', topic.id);

    // Create a test lesson
    const lesson = await prisma.lesson.create({
      data: {
        title: 'Test Lesson',
        description: 'A test lesson for testing purposes',
        order: 1,
        topicId: topic.id,
        createdBy: user.id,
      },
    });

    console.log('Created test lesson:', lesson.id);

    console.log('Test data created successfully!');
  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData()
  .then(() => console.log('Done'))
  .catch((error) => console.error('Failed:', error));
