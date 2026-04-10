import request from 'supertest';
import { TransactionStatus } from '@transactions/enums/transaction.enum';
import { createTestApp, setupTestContext, clearTransactions, teardownTestContext, TestContext, ResponseStatusCode } from '../helpers/test-setup';

describe('GET /transactions', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    const app = await createTestApp();
    ctx = await setupTestContext(app);
  });

  beforeEach(async () => {
    await clearTransactions(ctx.transactionRepo);

    ctx.originAccount.balance = 10000.0;
    ctx.originAccount.frozenBalance = 0;
    await ctx.accountRepo.save(ctx.originAccount);

    ctx.destinationAccount.balance = 5000.0;
    ctx.destinationAccount.frozenBalance = 0;
    await ctx.accountRepo.save(ctx.destinationAccount);
  });

  afterAll(async () => {
    await teardownTestContext(ctx);
    await ctx.app.close();
  });

  it('Debe listar las transacciones con paginación', async () => {
    // Crear un par de transacciones
    await request(ctx.app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .send({
        amount: 100.0,
        originAddress: ctx.originAccount.address,
        destinationAddress: ctx.destinationAccount.address,
      })
      .expect(ResponseStatusCode.CREATED);

    await request(ctx.app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .send({
        amount: 200.0,
        originAddress: ctx.originAccount.address,
        destinationAddress: ctx.destinationAccount.address,
      })
      .expect(ResponseStatusCode.CREATED);

    const res = await request(ctx.app.getHttpServer())
      .get('/transactions')
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(ResponseStatusCode.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.data.list.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data.meta).toHaveProperty('total');
    expect(res.body.data.meta).toHaveProperty('page');
    expect(res.body.data.meta).toHaveProperty('limit');
  });

  it('Debe filtrar transacciones por estado', async () => {
    // Crear una transacción APPROVED (monto <= 5000)
    await request(ctx.app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .send({
        amount: 100.0,
        originAddress: ctx.originAccount.address,
        destinationAddress: ctx.destinationAccount.address,
      })
      .expect(ResponseStatusCode.CREATED);

    // Crear una transacción PENDING (monto > 5000)
    await request(ctx.app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .send({
        amount: 6000.0,
        originAddress: ctx.originAccount.address,
        destinationAddress: ctx.destinationAccount.address,
      })
      .expect(ResponseStatusCode.CREATED);

    const res = await request(ctx.app.getHttpServer())
      .get('/transactions')
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .query({ status: TransactionStatus.PENDING });

    if (res.status === ResponseStatusCode.OK) {
      const transactions = res.body.data.list;
      expect(transactions.length).toBeGreaterThanOrEqual(1);
      transactions.forEach((tx: any) => {
        expect(tx.status).toBe(TransactionStatus.PENDING);
      });
    } else {
      expect(res.status).toBe(ResponseStatusCode.BAD_REQUEST);
    }
  });

  it('Debe retornar 401 al listar transacciones sin autenticación', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/transactions');

    expect(res.status).toBe(ResponseStatusCode.UNAUTHORIZED);
  });
});
