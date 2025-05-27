// Filsti: apps/api/src/main.ts
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { serverEnv } from '@repo/config/env';

declare const module: any; // For HMR (Hot Module Replacement)

async function bootstrap() {
  const logger = new Logger('EntryPoint');

  try {
    // Validate environment variables before starting the application
    const env = serverEnv();
    logger.log('✅ Environment variables validated successfully');

    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'debug', 'log', 'verbose'],
    });

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
      origin: process.env.NODE_ENV === 'production' ? corsOrigins : true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'X-Requested-With',
      ],
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

    // Cookie Parser
    app.use(cookieParser());

    // Swagger API Dokumentation Setup (kun i ikke-produktionsmiljø)
    if (process.env.NODE_ENV !== 'production') {
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
        .addTag(
          'Authentication',
          'Endpoints relateret til brugerautentifikation',
        )
        .addTag('Users', 'Endpoints relateret til brugerhåndtering')
        .addTag('Courses', 'Endpoints relateret til kurser')
        .addTag('Modules', 'Endpoints relateret til kursusmoduler')
        .addTag('Lessons', 'Endpoints relateret til lektioner')
        .addTag('Content', 'Endpoints relateret til indholdsblokke')
        .addTag('Quizzes', 'Endpoints relateret til quizzer og spørgsmål')
        .addTag('Progress', 'Endpoints relateret til brugerfremskridt')
        .build();

      const document = SwaggerModule.createDocument(app, swaggerConfig);

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
    }

    // Hent port fra miljøvariabel
    const currentPort = parseInt(process.env.PORT || '5002', 10);

    // Function to try listening on a port and increment if it fails
    const tryListen = async (port: number): Promise<number> => {
      try {
        await app.listen(port, '0.0.0.0');
        return port;
      } catch (error: any) {
        if (error.code === 'EADDRINUSE') {
          logger.warn(`Port ${port} is already in use, trying ${port + 1}`);
          return tryListen(port + 1);
        }
        throw error;
      }
    };

    const PORT = await tryListen(currentPort);

    // Graceful shutdown
    const shutdown = async () => {
      logger.log('Received shutdown signal, closing server...');
      await app.close();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    if (module.hot) {
      module.hot.accept();
      module.hot.dispose(() => app.close());
    }

    logger.log(`NestJS API server kører internt på http://localhost:${PORT}`);
    logger.log(`Miljø: ${process.env.NODE_ENV || 'development'}`);
    if (process.env.NODE_ENV !== 'production') {
      logger.log(
        `API Dokumentation (internt) er tilgængelig på http://localhost:${PORT}/api/docs`,
      );
    }
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}
bootstrap();
