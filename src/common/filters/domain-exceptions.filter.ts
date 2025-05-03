import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { EntityNotFoundException } from '../exceptions/entity-not-found.excention';
import { UpdateFailedException } from '../exceptions/entity-update-failed.exception';

@Catch(EntityNotFoundException)
export class DomainExceptionsFilter implements ExceptionFilter {
  catch(exception: EntityNotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (exception.constructor) {
      case EntityNotFoundException:
        response.status(404).json({
          statusCode: 404,
          message: exception.message,
        });
        break;

      case UpdateFailedException:
        response.status(400).json({
          statusCode: 400,
          message: exception.message,
        });
        break;

      default:
        response.status(500).json({
          statusCode: 500,
          message: 'An unexpected error occurred.',
        });
        break;
    }
  }
}
