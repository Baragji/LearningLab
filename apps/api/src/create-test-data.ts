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
        role: Role.ADMIN
      }
    });
    
    console.log('Created test user:', user.id);
    
    // Create a test subject area
    const subjectArea = await prisma.subjectArea.create({
      data: {
        name: 'Test Subject Area',
        slug: 'test-subject-area',
        description: 'A test subject area for testing purposes',
        createdBy: user.id
      }
    });
    
    console.log('Created test subject area:', subjectArea.id);
    
    // Create a test course
    const course = await prisma.course.create({
      data: {
        title: 'Test Course',
        description: 'A test course for testing purposes',
        slug: 'test-course',
        subjectAreaId: subjectArea.id,
        createdBy: user.id
      }
    });
    
    console.log('Created test course:', course.id);
    
    // Create a test module
    const module = await prisma.module.create({
      data: {
        title: 'Test Module',
        description: 'A test module for testing purposes',
        order: 1,
        courseId: course.id,
        createdBy: user.id
      }
    });
    
    console.log('Created test module:', module.id);
    
    // Create a test lesson
    const lesson = await prisma.lesson.create({
      data: {
        title: 'Test Lesson',
        description: 'A test lesson for testing purposes',
        order: 1,
        moduleId: module.id,
        createdBy: user.id
      }
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
  .catch(error => console.error('Failed:', error));