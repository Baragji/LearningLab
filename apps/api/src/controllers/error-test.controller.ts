// apps/api/src/controllers/error-test.controller.ts
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

/**
 * Controller til at teste fejlhåndtering
 * Denne controller er kun til udviklingsformål og bør fjernes i produktion
 */
@ApiTags('Error Testing')
@Controller('error-test')
export class ErrorTestController {
  /**
   * Kaster en HttpException med en bestemt statuskode
   */
  @Get('http-exception/:statusCode')
  @ApiOperation({ summary: 'Test af HttpException med specifik statuskode' })
  @ApiParam({ name: 'statusCode', description: 'HTTP statuskode', example: 400 })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  testHttpException(@Param('statusCode') statusCode: string) {
    const code = parseInt(statusCode, 10);
    throw new HttpException(
      `Dette er en test af HttpException med statuskode ${code}`,
      code,
    );
  }

  /**
   * Kaster en NotFoundException (404)
   */
  @Get('not-found')
  @ApiOperation({ summary: 'Test af NotFoundException' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  testNotFoundException() {
    throw new NotFoundException('Ressourcen blev ikke fundet');
  }

  /**
   * Kaster en UnauthorizedException (401)
   */
  @Get('unauthorized')
  @ApiOperation({ summary: 'Test af UnauthorizedException' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  testUnauthorizedException() {
    throw new UnauthorizedException('Du er ikke autoriseret til at tilgå denne ressource');
  }

  /**
   * Kaster en InternalServerErrorException (500)
   */
  @Get('server-error')
  @ApiOperation({ summary: 'Test af InternalServerErrorException' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  testInternalServerErrorException() {
    throw new InternalServerErrorException('Der opstod en intern serverfejl');
  }

  /**
   * Kaster en almindelig JavaScript Error
   */
  @Get('js-error')
  @ApiOperation({ summary: 'Test af almindelig JavaScript Error' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  testJsError() {
    throw new Error('Dette er en test af en almindelig JavaScript Error');
  }

  /**
   * Simulerer en database-fejl
   */
  @Get('database-error')
  @ApiOperation({ summary: 'Test af databasefejl' })
  @ApiResponse({ status: 500, description: 'Database Error' })
  testDatabaseError() {
    const error = new Error('Kunne ikke forbinde til databasen');
    error.name = 'PrismaClientKnownRequestError';
    throw error;
  }
}