import { PrismaClient, ContentBlockType } from '@prisma/client';

async function testContentBlockTypes() {
  console.log('Testing ContentBlockType enum...');
  
  // Log all available ContentBlockType values
  console.log('Available ContentBlockType values:');
  Object.values(ContentBlockType).forEach(type => {
    console.log(`- ${type}`);
  });
  
  // Create a new Prisma client
  const prisma = new PrismaClient();
  
  try {
    // Try to create a content block with each type
    for (const type of Object.values(ContentBlockType)) {
      console.log(`Testing ContentBlockType: ${type}`);
      
      // Find a lesson to attach the content block to
      const lesson = await prisma.lesson.findFirst({
        where: { deletedAt: null }
      });
      
      if (!lesson) {
        console.log('No lessons found to test with. Please create a lesson first.');
        return;
      }
      
      // Create a test content block
      const contentBlock = await prisma.contentBlock.create({
        data: {
          type: type,
          content: `Test content for ${type}`,
          order: 1,
          lessonId: lesson.id
        }
      });
      
      console.log(`Successfully created content block with type ${type}, ID: ${contentBlock.id}`);
      
      // Clean up - delete the test content block
      await prisma.contentBlock.delete({
        where: { id: contentBlock.id }
      });
    }
    
    console.log('All ContentBlockType values tested successfully!');
  } catch (error) {
    console.error('Error testing ContentBlockType:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testContentBlockTypes()
  .then(() => console.log('Test completed'))
  .catch(error => console.error('Test failed:', error));