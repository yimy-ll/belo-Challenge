export const GenericResponseSchema = (dataSchema: any, statusCode: number) => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    statusCode: { type: 'number', example: statusCode },
    data: dataSchema
  }
});

export const TransactionSwaggerSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' },
    amount: { type: 'number', example: 100.5 },
    type: { type: 'string', example: 'DEPOSIT' },
    status: { type: 'string', example: 'PENDING' },
    createdAt: { type: 'string', example: '2024-04-09T12:00:00.000Z' },
    updatedAt: { type: 'string', example: '2024-04-09T12:00:00.000Z' }
  }
};

export const AuthLoginSwaggerSchema = {
  type: 'object',
  properties: {
    access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    user: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' },
        email: { type: 'string', example: 'usuario@ejemplo.com' },
        name: { type: 'string', example: 'Juan Perez' }
      }
    }
  }
};

export const PaginationSwaggerSchema = {
  type: 'object',
  properties: {
    list: { type: 'array', items: TransactionSwaggerSchema },
    total: { type: 'number', example: 50 },
    page: { type: 'number', example: 1 },
    limit: { type: 'number', example: 10 },
    totalPages: { type: 'number', example: 5 }
  }
};
