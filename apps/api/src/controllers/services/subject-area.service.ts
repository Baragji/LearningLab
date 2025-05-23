// apps/api/src/controllers/services/subject-area.service.ts
import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma/prisma.service';
import { BaseService } from '../../common/services/base.service';
import { SubjectArea } from '@prisma/client';
import { CreateSubjectAreaDto, UpdateSubjectAreaDto } from '../dto/subject-area/subject-area.dto';

@Injectable()
export class SubjectAreaService extends BaseService<SubjectArea> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Finder et fagområde ud fra slug
   * @param slug Fagområde slug
   * @returns Fagområde eller null hvis ikke fundet
   */
  async findBySlug(slug: string): Promise<SubjectArea | null> {
    return this.prisma.subjectArea.findFirst({
      where: { 
        slug,
        deletedAt: null
      },
      include: { courses: true }
    });
  }

  /**
   * Opretter et nyt fagområde
   * @param createSubjectAreaDto DTO med fagområde data
   * @param userId ID på brugeren der opretter fagområdet
   * @returns Det oprettede fagområde
   */
  async createSubjectArea(createSubjectAreaDto: CreateSubjectAreaDto, userId?: number): Promise<SubjectArea> {
    const { name, slug } = createSubjectAreaDto;

    // Tjek om slug allerede eksisterer
    const existingSubjectArea = await this.prisma.subjectArea.findFirst({
      where: { 
        slug,
        deletedAt: null
      }
    });

    if (existingSubjectArea) {
      throw new ConflictException('Et fagområde med dette slug eksisterer allerede');
    }

    return this.create({ name, slug }, userId);
  }

  /**
   * Opdaterer et eksisterende fagområde
   * @param id Fagområde ID
   * @param updateSubjectAreaDto DTO med opdateret fagområde data
   * @param userId ID på brugeren der opdaterer fagområdet
   * @returns Det opdaterede fagområde
   */
  async updateSubjectArea(id: number, updateSubjectAreaDto: UpdateSubjectAreaDto, userId?: number): Promise<SubjectArea> {
    const { name, slug } = updateSubjectAreaDto;

    // Tjek om fagområdet eksisterer
    const existingSubjectArea = await this.findById(id);

    // Hvis slug ændres, tjek om det nye slug allerede er i brug
    if (slug && slug !== existingSubjectArea.slug) {
      const slugExists = await this.prisma.subjectArea.findFirst({
        where: { 
          slug,
          deletedAt: null,
          id: { not: id } // Ekskluder det nuværende fagområde
        }
      });

      if (slugExists) {
        throw new ConflictException('Et fagområde med dette slug eksisterer allerede');
      }
    }

    return this.update(id, { 
      name: name || existingSubjectArea.name,
      slug: slug || existingSubjectArea.slug
    }, userId);
  }

  /**
   * Sletter et fagområde (soft delete)
   * @param id Fagområde ID
   * @param userId ID på brugeren der sletter fagområdet
   * @returns Det slettede fagområde
   */
  async deleteSubjectArea(id: number, userId?: number): Promise<SubjectArea> {
    // Tjek om fagområdet eksisterer
    const existingSubjectArea = await this.findById(id);

    // Tjek om der er kurser tilknyttet fagområdet
    const coursesCount = await this.prisma.course.count({
      where: { 
        subjectAreaId: id,
        deletedAt: null
      }
    });

    if (coursesCount > 0) {
      throw new BadRequestException(
        'Fagområdet kan ikke slettes, da der er kurser tilknyttet. Slet venligst kurserne først.'
      );
    }

    return this.softDelete(id, userId);
  }

  /**
   * Returnerer modelnavnet for Prisma-klienten
   */
  protected getModelName(): string {
    return 'subjectArea';
  }

  /**
   * Returnerer et brugervenligt navn for modellen til fejlmeddelelser
   */
  protected getModelDisplayName(): string {
    return 'Fagområde';
  }
}