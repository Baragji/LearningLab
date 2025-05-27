// apps/api/src/controllers/certificate.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PrismaService } from '../persistence/prisma/prisma.service';
import {
  CertificateDto,
  CreateCertificateDto,
  UpdateCertificateDto,
} from './dto/certificate/certificate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@repo/core';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Certificates')
@Controller('certificates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CertificateController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get all certificates' })
  @ApiResponse({
    status: 200,
    description: 'List of certificates',
    type: [CertificateDto],
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filter by user ID',
    type: Number,
  })
  @ApiQuery({
    name: 'quizId',
    required: false,
    description: 'Filter by quiz ID',
    type: Number,
  })
  @Roles(Role.ADMIN, Role.TEACHER)
  async getAllCertificates(
    @Query('userId', ParseIntPipe) userId?: number,
    @Query('quizId', ParseIntPipe) quizId?: number,
  ) {
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (quizId) {
      where.quizId = quizId;
    }

    return this.prisma.certificate.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  @Get('my')
  @ApiOperation({ summary: 'Get certificates for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of certificates for the current user',
    type: [CertificateDto],
  })
  async getMyCertificates(@Req() req: any) {
    const userId = req.user.id;

    return this.prisma.certificate.findMany({
      where: { userId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a certificate by ID' })
  @ApiResponse({
    status: 200,
    description: 'The certificate',
    type: CertificateDto,
  })
  @ApiParam({ name: 'id', description: 'Certificate ID' })
  async getCertificate(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Check if the user is allowed to view this certificate
    if (
      req.user.role !== Role.ADMIN &&
      req.user.role !== Role.TEACHER &&
      certificate.userId !== req.user.id
    ) {
      throw new Error('You are not authorized to view this certificate');
    }

    return certificate;
  }

  @Get('verify/:certificateId')
  @ApiOperation({ summary: 'Verify a certificate by its unique ID' })
  @ApiResponse({
    status: 200,
    description: 'Certificate verification result',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        certificate: { type: 'object' },
      },
    },
  })
  @ApiParam({ name: 'certificateId', description: 'Unique certificate ID' })
  async verifyCertificate(@Param('certificateId') certificateId: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { certificateId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return {
      valid: !!certificate,
      certificate: certificate || null,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new certificate' })
  @ApiResponse({
    status: 201,
    description: 'The created certificate',
    type: CertificateDto,
  })
  @Roles(Role.ADMIN, Role.TEACHER)
  async createCertificate(
    @Body() data: CreateCertificateDto,
    @Req() _req: any,
  ) {
    // Generate a unique certificate ID
    const certificateId = `CERT-${uuidv4().substring(0, 8)}`;

    return this.prisma.certificate.create({
      data: {
        ...data,
        certificateId,
        issueDate: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a certificate' })
  @ApiResponse({
    status: 200,
    description: 'The updated certificate',
    type: CertificateDto,
  })
  @ApiParam({ name: 'id', description: 'Certificate ID' })
  @Roles(Role.ADMIN, Role.TEACHER)
  async updateCertificate(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCertificateDto,
  ) {
    return this.prisma.certificate.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a certificate' })
  @ApiResponse({ status: 204, description: 'Certificate deleted' })
  @ApiParam({ name: 'id', description: 'Certificate ID' })
  @Roles(Role.ADMIN)
  async deleteCertificate(@Param('id', ParseIntPipe) id: number) {
    await this.prisma.certificate.delete({
      where: { id },
    });

    return { success: true };
  }
}
