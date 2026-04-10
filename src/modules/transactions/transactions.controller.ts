import { Body, Controller, Get, Param, Patch, Post, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateDto } from '@/modules/transactions/dto/create.dto';
import { FilterDto } from '@/modules/transactions/dto/filter.dto';
import { TransactionsService } from '@transactions/transactions.service';
import { TransformResponseInterceptor } from '@common/interceptors/transform-response-interceptor';
import { PaginationDto } from '@common/dto/pagination.dto';
import { GenericResponseSchema, PaginationSwaggerSchema, TransactionSwaggerSchema } from '@common/swagger/swagger.schemas';

@ApiTags('Transactions')
@Controller('transactions')
@UseInterceptors(TransformResponseInterceptor)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  @ApiOperation({ summary: 'Crear una transacción', description: 'Crea una nueva transacción utilizando un monto, la dirección de origen y la dirección de destino.' })
  @ApiResponse({ status: 201, description: 'Transacción creada exitosamente.', schema: GenericResponseSchema(TransactionSwaggerSchema, 201) })
  @ApiResponse({ status: 400, description: 'Datos inválidos suministrados.' })
  @Post()
  async create(@Body() createTransactionDto: CreateDto) {
    return this.transactionsService.create(createTransactionDto);
  }

  @ApiOperation({ summary: 'Listar transacciones', description: 'Obtiene una lista de las transacciones. Soporta paginación y filtros por estado de la transacción y usuario.' })
  @ApiResponse({
    status: 200,
    description: 'Transacciones obtenidas correctamente.',
    schema: GenericResponseSchema(PaginationSwaggerSchema, 200)
  })
  @Get()
  async findAll(@Query() filterDto: FilterDto, @Query() paginationDto: PaginationDto) {
    return this.transactionsService.findAll(filterDto, paginationDto);
  }

  @ApiOperation({ summary: 'Aprobar una transacción', description: 'Cambia el estado de una transacción pendiente a aprobada.' })
  @ApiParam({ name: 'id', description: 'El ID único de la transacción que se desea aprobar', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiResponse({ status: 200, description: 'Transacción aprobada existosamente.', schema: GenericResponseSchema(TransactionSwaggerSchema, 200) })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada.' })
  @Patch(':id/approve')
  async approve(@Param('id') transactionId: string) {
    return this.transactionsService.approve(transactionId);
  }

  @ApiOperation({ summary: 'Rechazar una transacción', description: 'Cambia el estado de una transacción pendiente a rechazada.' })
  @ApiParam({ name: 'id', description: 'El ID único de la transacción que se desea rechazar', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiResponse({ status: 200, description: 'Transacción rechazada exitosamente.', schema: GenericResponseSchema(TransactionSwaggerSchema, 200) })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada.' })
  @Patch(':id/reject')
  async reject(@Param('id') transactionId: string) {
    return this.transactionsService.reject(transactionId);
  }
}
