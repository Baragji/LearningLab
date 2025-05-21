// apps/api/src/modules/user-progress.module.ts
import { Module } from '@nestjs/common';
import { UserProgressController } from '../controllers/userProgress.controller';
import { PersistenceModule } from '../persistence/persistence.module'; // Importer PersistenceModule
import { AuthModule } from '../auth/auth.module'; // Importer AuthModule hvis JwtAuthGuard bruges globalt eller her

@Module({
  imports: [
    PersistenceModule, // Gør PrismaService tilgængelig
    AuthModule,        // Gør JwtAuthGuard mv. tilgængelig, hvis den ikke er global
  ],
  controllers: [UserProgressController],
  providers: [], // PrismaService leveres af PersistenceModule
})
export class UserProgressModule {}
