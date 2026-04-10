import { BadRequestException } from '@nestjs/common';

export class TransactionNotPendingException extends BadRequestException {
  constructor() {
    super({
      statusCode: 400,
      error: 'Bad Request',
      message: 'The transaction cannot be modified because it is not in pending state',
      code: 'TRANSACTION_NOT_PENDING',
    });
  }
}
