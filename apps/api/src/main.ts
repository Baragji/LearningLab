// apps/api/src/main.ts
import { Logger, ValidationPipe } from '@nestjs/common'; // Importer ValidationPipe
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

declare const module: any; // For HMR (Hot Module Replacement)

async function bootstrap() {
  const logger = new Logger('EntryPoint');
  const app = await NestFactory.create(AppModule);

  // Global Validation Pipe
  // Dette sikrer, at alle indkommende data til controllere valideres
  // baseret på DTO'er (Data Transfer Objects) og class-validator decorators.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Fjerner automatisk properties, der ikke er defineret i DTO'en.
      forbidNonWhitelisted: true, // Kaster en fejl, hvis der sendes properties, der ikke er i DTO'en.
      transform: true, // Transformer automatisk indkommende data til DTO-instanser.
      transformOptions: {
        enableImplicitConversion: true, // Tillader implicit konvertering af typer (f.eks. string fra URL-parametre til number).
      },
    }),
  );

  // Swagger API Dokumentation Setup
  // Swagger (OpenAPI) bruges til at generere interaktiv API-dokumentation.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Læringsplatform API') // Opdateret titel for API-dokumentationen
    .setDescription('API Dokumentation for den avancerede læringsplatform') // Opdateret beskrivelse
    .setVersion('1.0')
    .addBearerAuth() // Tilføjer mulighed for at specificere Bearer Token (JWT) i Swagger UI, forbereder til autentificering
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  // Gør API-dokumentationen tilgængelig på /docs endpointet (f.eks. http://localhost/api/docs via Nginx)
  SwaggerModule.setup('docs', app, document);

  // Sæt porten for API'en. Brug miljøvariablen PORT hvis den er sat, ellers default til 5002.
  const PORT = process.env.PORT || 5002;

  await app.listen(PORT);

  // HMR (Hot Module Replacement) opsætning (kun for udvikling)
  // Dette tillader moduler at blive genindlæst uden at genstarte hele applikationen.
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }

  // Log-beskeder til terminalen for at vise, at serveren kører.
  logger.log(`NestJS API server kører internt på http://localhost:${PORT}`);
  logger.log(`API Dokumentation (internt) er tilgængelig på http://localhost:${PORT}/docs`);
  logger.log(`Hele applikationen (via Nginx) burde være tilgængelig på http://localhost`);
  logger.log(`API'en (via Nginx) burde være tilgængelig på http://localhost/api/`);
}
bootstrap();
