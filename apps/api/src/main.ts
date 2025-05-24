// Filsti: apps/api/src/main.ts
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

declare const module: any; // For HMR (Hot Module Replacement)

async function bootstrap() {
  const logger = new Logger('EntryPoint');
  const app = await NestFactory.create(AppModule);

  // Sæt et globalt prefix for alle API-ruter
  app.setGlobalPrefix('api');

  // Konfigurer CORS
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:3007',
      ];

  app.enableCors({
    origin: true, // Tillad alle origins i udviklingsmiljø
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization,Accept',
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Exception Filter er registreret i app.module.ts via APP_FILTER

  // Cookie Parser
  app.use(cookieParser());

  // CSRF Protection is handled by CsrfMiddleware in app.module.ts
  // Removing duplicate implementation here

  // Swagger API Dokumentation Setup
  // Swagger UI vil nu være tilgængelig på /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Læringsplatform API')
    .setDescription('API Dokumentation for den avancerede læringsplatform')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    })
    .addTag('App', 'Generelle applikationsendpoints')
    .addTag('Authentication', 'Endpoints relateret til brugerautentifikation')
    .addTag('Users', 'Endpoints relateret til brugerhåndtering')
    .addTag('Courses', 'Endpoints relateret til kurser')
    .addTag('Modules', 'Endpoints relateret til kursusmoduler')
    .addTag('Lessons', 'Endpoints relateret til lektioner')
    .addTag('Content', 'Endpoints relateret til indholdsblokke')
    .addTag('Quizzes', 'Endpoints relateret til quizzer og spørgsmål')
    .addTag('Progress', 'Endpoints relateret til brugerfremskridt')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Swagger UI er nu på /api/docs på grund af global prefix
  // Vi bruger 'api/docs' for at undgå konflikter med global prefix
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Hent port fra miljøvariabel
  const currentPort = parseInt(process.env.PORT || '5002', 10);

  // Function to try listening on a port and increment if it fails
  const tryListen = async (port: number): Promise<number> => {
    try {
      await app.listen(port);
      return port;
    } catch (error: any) {
      // Type as any to access error.code
      if (error.code === 'EADDRINUSE') {
        logger.warn(`Port ${port} is already in use, trying ${port + 1}`);
        return tryListen(port + 1);
      }
      throw error;
    }
  };

  const PORT = await tryListen(currentPort);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }

  logger.log(`NestJS API server kører internt på http://localhost:${PORT}`);
  logger.log(
    `API Dokumentation (internt) er tilgængelig på http://localhost:${PORT}/api/docs`,
  );
  logger.log(`Miljø: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
