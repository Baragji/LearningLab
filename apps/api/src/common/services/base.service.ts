// apps/api/src/common/services/base.service.ts
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma/prisma.service';

/**
 * Base service der implementerer standard CRUD-operationer med soft delete-funktionalitet
 * og sporing af brugerhandlinger (createdBy, updatedBy).
 */
export abstract class BaseService<T> {
  constructor(protected readonly prisma: PrismaService) {}

  /**
   * Finder alle poster af en bestemt model, ekskluderer slettede poster
   * @param filter Valgfrit filter
   * @returns Array af poster
   */
  async findAll(filter: any = {}): Promise<T[]> {
    return this.prisma[this.getModelName()].findMany({
      where: { ...filter, deletedAt: null }
    });
  }

  /**
   * Finder en post ud fra ID, ekskluderer slettede poster
   * @param id Post ID
   * @returns Post eller null hvis ikke fundet
   */
  async findById(id: number): Promise<T | null> {
    const item = await this.prisma[this.getModelName()].findUnique({
      where: { id, deletedAt: null }
    });

    if (!item) {
      throw new NotFoundException(`${this.getModelDisplayName()} med ID ${id} blev ikke fundet`);
    }

    return item;
  }

  /**
   * Opretter en ny post med bruger-ID for sporing
   * @param data Post data
   * @param userId ID på brugeren der opretter posten
   * @returns Den oprettede post
   */
  async create(data: any, userId?: number): Promise<T> {
    try {
      return await this.prisma[this.getModelName()].create({
        data: { 
          ...data, 
          createdBy: userId || null,
          updatedBy: userId || null
        }
      });
    } catch (error) {
      this.handleDatabaseError(error, 'oprettelse');
    }
  }

  /**
   * Opdaterer en eksisterende post med bruger-ID for sporing
   * @param id Post ID
   * @param data Data der skal opdateres
   * @param userId ID på brugeren der opdaterer posten
   * @returns Den opdaterede post
   */
  async update(id: number, data: any, userId?: number): Promise<T> {
    try {
      // Tjek om posten eksisterer og ikke er slettet
      await this.findById(id);

      return await this.prisma[this.getModelName()].update({
        where: { id },
        data: { 
          ...data, 
          updatedBy: userId || null 
        }
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleDatabaseError(error, 'opdatering');
    }
  }

  /**
   * Soft delete - markerer en post som slettet i stedet for at fjerne den
   * @param id Post ID
   * @param userId ID på brugeren der sletter posten
   * @returns Den slettede post
   */
  async softDelete(id: number, userId?: number): Promise<T> {
    try {
      // Tjek om posten eksisterer og ikke allerede er slettet
      await this.findById(id);

      return await this.prisma[this.getModelName()].update({
        where: { id },
        data: { 
          deletedAt: new Date(), 
          updatedBy: userId || null 
        }
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleDatabaseError(error, 'sletning');
    }
  }

  /**
   * Genopret en slettet post
   * @param id Post ID
   * @param userId ID på brugeren der genopretter posten
   * @returns Den genoprettede post
   */
  async restore(id: number, userId?: number): Promise<T> {
    try {
      // Tjek om posten eksisterer (også selvom den er slettet)
      const item = await this.prisma[this.getModelName()].findUnique({
        where: { id }
      });

      if (!item) {
        throw new NotFoundException(`${this.getModelDisplayName()} med ID ${id} blev ikke fundet`);
      }

      if (!item['deletedAt']) {
        throw new BadRequestException(`${this.getModelDisplayName()} med ID ${id} er ikke slettet`);
      }

      return await this.prisma[this.getModelName()].update({
        where: { id },
        data: { 
          deletedAt: null, 
          updatedBy: userId || null 
        }
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.handleDatabaseError(error, 'genopretning');
    }
  }

  /**
   * Håndterer databasefejl og kaster passende exceptions
   * @param error Fejlobjekt
   * @param operation Operationstype (oprettelse, opdatering, sletning)
   */
  protected handleDatabaseError(error: any, operation: string): never {
    console.error(`Databasefejl under ${operation}:`, error);
    throw new BadRequestException(`Der opstod en fejl under ${operation} af ${this.getModelDisplayName().toLowerCase()}`);
  }

  /**
   * Returnerer modelnavnet for Prisma-klienten
   * Skal implementeres af afledte klasser
   */
  protected abstract getModelName(): string;

  /**
   * Returnerer et brugervenligt navn for modellen til fejlmeddelelser
   * Kan overskrives af afledte klasser
   */
  protected getModelDisplayName(): string {
    return this.getModelName();
  }
}