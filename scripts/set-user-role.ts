import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userIdToUpdate = 2; // ID for testadmin@example.com
  const newRole = Role.ADMIN;

  try {
    const user = await prisma.user.update({
      where: { id: userIdToUpdate },
      data: { role: newRole },
    });
    console.log(`Successfully updated role for user ${user.email} (ID: ${user.id}) to ${user.role}`);
  } catch (error) {
    console.error(`Error updating user role for ID ${userIdToUpdate}:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 