import { NotFoundException } from '@nestjs/common';

export class AccountNotFoundException extends NotFoundException {
  constructor(address?: string) {
    super({
      statusCode: 404,
      error: 'Not Found',
      message: `Account ${address || ''} does not exist`,
      code: 'ACCOUNT_NOT_FOUND',
    });
  }
}
