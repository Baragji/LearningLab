// apps/api/src/users/users.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PersistenceModule } from '../persistence/persistence.module'; // Importer PersistenceModule, der indeholder PrismaService
import { AuthModule } from '../auth/auth.module'; // Import af AuthModule for at demonstrere håndtering af cirkulære afhængigheder

@Module({
  imports: [
    PersistenceModule, // Gør PrismaService tilgængelig for UsersService
    // Hvis UsersModule har brug for AuthModule i fremtiden, kan det importeres sådan:
    // forwardRef(() => AuthModule), // Brug forwardRef for at undgå cirkulære afhængigheder
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Gør UsersService tilgængelig for andre moduler (f.eks. AuthModule)
})
export class UsersModule {}
