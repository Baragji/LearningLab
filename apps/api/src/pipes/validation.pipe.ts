import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import DOMPurify from 'isomorphic-dompurify';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(CustomValidationPipe.name);

  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return this.sanitizeInput(value);
    }

    // Sanitize input before validation
    const sanitizedValue = this.sanitizeInput(value);

    // Transform to class instance
    const object = plainToInstance(metatype, sanitizedValue);

    // Validate
    const errors = await validate(object, {
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Transform values to their target types
      validateCustomDecorators: true,
    });

    if (errors.length > 0) {
      const errorMessages = this.formatValidationErrors(errors);
      this.logger.warn(`Validation failed: ${JSON.stringify(errorMessages)}`);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errorMessages,
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private sanitizeInput(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      // Remove potentially dangerous characters and sanitize HTML
      let sanitized = value.trim();

      // Basic XSS protection - sanitize HTML content
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: [], // No HTML tags allowed by default
        ALLOWED_ATTR: [],
      });

      // Remove null bytes and other control characters
      sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

      return sanitized;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeInput(item));
    }

    if (typeof value === 'object') {
      const sanitized: any = {};
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          // Sanitize both key and value
          const sanitizedKey = this.sanitizeInput(key);
          sanitized[sanitizedKey] = this.sanitizeInput(value[key]);
        }
      }
      return sanitized;
    }

    return value;
  }

  private formatValidationErrors(errors: any[]): any[] {
    return errors.map((error) => {
      const constraints = error.constraints;
      const children = error.children;

      const formattedError: any = {
        property: error.property,
        value: error.value,
      };

      if (constraints) {
        formattedError.constraints = Object.values(constraints);
      }

      if (children && children.length > 0) {
        formattedError.children = this.formatValidationErrors(children);
      }

      return formattedError;
    });
  }
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly logger = new Logger(FileValidationPipe.name);
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
  ];

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size too large. Maximum allowed size is ${this.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // Sanitize filename
    if (file.originalname) {
      file.originalname = this.sanitizeFilename(file.originalname);
    }

    this.logger.log(
      `File validated: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`,
    );

    return file;
  }

  private sanitizeFilename(filename: string): string {
    // Remove path traversal attempts and dangerous characters
    return filename
      .replace(/[\x00-\x1f\x80-\x9f]/g, '') // Remove control characters
      .replace(/[<>:"/\\|?*]/g, '') // Remove Windows forbidden characters
      .replace(/\.\.+/g, '.') // Replace multiple dots with single dot
      .replace(/^\.|\.$/, '') // Remove leading/trailing dots
      .trim();
  }
}
