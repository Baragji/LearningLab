// Filsti: apps/api/src/main.ts
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

declare const module: any; // For HMR (Hot Module Replacement)

async function bootstrap() {
  const logger = new Logger('EntryPoint');
  const app = await NestFactory.create(AppModule);

  // Sæt et globalt prefix for alle API-ruter
  app.setGlobalPrefix('api'); // <--- TILFØJET DENNE LINJE

  // Konfigurer CORS
  app.enableCors({
    origin: [
      'http://localhost:3000', // Standard Next.js port
      'http://localhost:3001', // Hvis port 3000 er optaget
      'http://localhost:3002', // Hvis port 3001 er optaget
      'http://localhost:3003', // Hvis port 3002 er optaget
      // Tilføj andre porte, din Next.js app måtte bruge under udvikling
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
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

  // Swagger API Dokumentation Setup
  // Swagger UI vil nu være tilgængelig på /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Læringsplatform API')
    .setDescription('API Dokumentation for den avancerede læringsplatform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  // Swagger UI er nu på /api/docs på grund af global prefix
  SwaggerModule.setup('docs', app, document);

  const PORT = process.env.PORT || 5002;

  await app.listen(PORT);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }

  logger.log(`NestJS API server kører internt på http://localhost:${PORT}`);
  logger.log(
    `API Dokumentation (internt) er tilgængelig på http://localhost:${PORT}/api/docs`, // Opdateret Swagger URL
  );
  // Nginx-relaterede logs er mindre relevante nu, da vi kører direkte
  // logger.log(
  //   `Hele applikationen (via Nginx) burde være tilgængelig på http://localhost`,
  // );
  // logger.log(
  //   `API'en (via Nginx) burde være tilgængelig på http://localhost/api/`,
  // );
}
bootstrap();
