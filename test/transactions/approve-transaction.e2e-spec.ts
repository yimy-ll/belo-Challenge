import request from 'supertest';
import { TransactionStatus } from '@transactions/enums/transaction.enum';
import { createTestApp, setupTestContext, clearTransactions, teardownTestContext, TestContext, ResponseStatusCode } from '../helpers/test-setup';

describe('PATCH /transactions/:id/approve', () => {
  let ctx: TestContext;
  let pendingTransaction: any;

  beforeAll(async () => {
    const app = await createTestApp();
    ctx = await setupTestContext(app);
  });

  beforeEach(async () => {
    await clearTransactions(ctx.transactionRepo);

    ctx.originAccount.balance = 10000.50;
    ctx.originAccount.frozenBalance = 0;
    await ctx.accountRepo.save(ctx.originAccount);

    ctx.destinationAccount.balance = 5000.50;
    ctx.destinationAccount.frozenBalance = 0;
    await ctx.accountRepo.save(ctx.destinationAccount);

    const res = await request(ctx.app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .send({
        amount: 6000.90,
        originAddress: ctx.originAccount.address,
        destinationAddress: ctx.destinationAccount.address,
      });

    pendingTransaction = res.body.data;
  });

  afterAll(async () => {
    await teardownTestContext(ctx);
    await ctx.app.close();
  });

  it('Debe aprobar una transacción PENDING y transferir los fondos correctamente', async () => {
    const res = await request(ctx.app.getHttpServer())
      .patch(`/transactions/${pendingTransaction.id}/approve`)
      .set('Authorization', `Bearer ${ctx.authToken}`);

    if (res.status !== ResponseStatusCode.OK) {
      console.log("APPROVE ERROR:", res.body);
      console.log("PENDING TRANSACTION:", pendingTransaction);
    }
    expect(res.status).toBe(ResponseStatusCode.OK);
    expect(res.body.data.status).toBe(TransactionStatus.APPROVED);

    const originAfter = await ctx.accountRepo.findOne({ where: { id: ctx.originAccount.id } });
    const destAfter = await ctx.accountRepo.findOne({ where: { id: ctx.destinationAccount.id } });

    expect(Number(originAfter!.balance)).toBe(10000.50 - 6000.90);
    expect(Number(originAfter!.frozenBalance)).toBe(0);
    expect(Number(destAfter!.balance)).toBe(5000.50 + 6000.90);
  });

  it('Debe retornar error si se intenta aprobar una transacción que ya fue APPROVED', async () => {
    // Primero aprobar
    await request(ctx.app.getHttpServer())
      .patch(`/transactions/${pendingTransaction.id}/approve`)
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .expect(200);

    const res = await request(ctx.app.getHttpServer())
      .patch(`/transactions/${pendingTransaction.id}/approve`)
      .set('Authorization', `Bearer ${ctx.authToken}`);

    expect(res.status).toBe(ResponseStatusCode.BAD_REQUEST);
    expect(res.body.success).toBe(false);
  });

  it('Debe retornar error si se intenta aprobar una transacción que fue REJECTED', async () => {
    // Primero rechazar
    await request(ctx.app.getHttpServer())
      .patch(`/transactions/${pendingTransaction.id}/reject`)
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .expect(ResponseStatusCode.OK);

    // Intentar aprobar
    const res = await request(ctx.app.getHttpServer())
      .patch(`/transactions/${pendingTransaction.id}/approve`)
      .set('Authorization', `Bearer ${ctx.authToken}`);

    expect(res.status).toBe(ResponseStatusCode.BAD_REQUEST);
    expect(res.body.success).toBe(false);
  });
});
