// apps/api/src/controllers/error-test.controller.ts
import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@app/auth/decorators/public.decorator';

/**
 * Controller til at teste fejlhåndtering
 * Denne controller er kun til udviklingsformål og bør fjernes i produktion
 */
@ApiTags('Error Testing')
@Controller('error-test')
@Public() // Make all endpoints public for testing
export class ErrorTestController {
  /**
   * Kaster en HttpException med en bestemt statuskode
   */
  @Get('http-exception/:statusCode')
  @ApiOperation({ summary: 'Test af HttpException med specifik statuskode' })
  @ApiParam({
    name: 'statusCode',
    description: 'HTTP statuskode',
    example: 400,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  testHttpException(@Param('statusCode') statusCode: string): never {
    const code = parseInt(statusCode, 10);
    throw new HttpException(
      `Dette er en test af HttpException med statuskode ${code}`,
      code,
    );
  }

  /**
   * Kaster en BadRequestException (400)
   */
  @Get('400')
  @ApiOperation({ summary: 'Test af BadRequestException' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  test400(): never {
    throw new BadRequestException('Dette er en test af BadRequestException');
  }

  /**
   * Kaster en UnauthorizedException (401)
   */
  @Get('401')
  @ApiOperation({ summary: 'Test af UnauthorizedException' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  test401(): never {
    throw new UnauthorizedException('Du er ikke autoriseret til at tilgå denne ressource');
  }

  /**
   * Kaster en ForbiddenException (403)
   */
  @Get('403')
  @ApiOperation({ summary: 'Test af ForbiddenException' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  test403(): never {
    throw new ForbiddenException('Du har ikke adgang til denne ressource');
  }

  /**
   * Kaster en NotFoundException (404)
   */
  @Get('404')
  @ApiOperation({ summary: 'Test af NotFoundException' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  test404(): never {
    throw new NotFoundException('Ressourcen blev ikke fundet');
  }

  /**
   * Kaster en InternalServerErrorException (500)
   */
  @Get('500')
  @ApiOperation({ summary: 'Test af InternalServerErrorException' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  test500(): never {
    throw new InternalServerErrorException('Der opstod en intern serverfejl');
  }

  /**
   * Kaster en almindelig JavaScript Error
   */
  @Get('unhandled')
  @ApiOperation({ summary: 'Test af almindelig JavaScript Error' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  testUnhandled(): never {
    throw new Error('Dette er en test af en almindelig JavaScript Error');
  }

  /**
   * Kaster en custom HttpException
   */
  @Get('custom')
  @ApiOperation({ summary: 'Test af custom HttpException' })
  @ApiResponse({ status: 418, description: "I'm a teapot" })
  testCustom(): never {
    throw new HttpException("I'm a teapot", HttpStatus.I_AM_A_TEAPOT);
  }

  /**
   * Simulerer en database-fejl
   */
  @Get('database-error')
  @ApiOperation({ summary: 'Test af databasefejl' })
  @ApiResponse({ status: 500, description: 'Database Error' })
  testDatabaseError(): never {
    const error = new Error('Kunne ikke forbinde til databasen');
    error.name = 'PrismaClientKnownRequestError';
    throw error;
  }
}
