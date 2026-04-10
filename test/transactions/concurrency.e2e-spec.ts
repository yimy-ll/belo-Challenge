import request from 'supertest';
import { createTestApp, setupTestContext, clearTransactions, teardownTestContext, TestContext } from '../helpers/test-setup';

describe('Concurrencia (Race Conditions)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    const app = await createTestApp();
    ctx = await setupTestContext(app);
  });

  beforeEach(async () => {
    await clearTransactions(ctx.transactionRepo);

    // Resetear saldos
    ctx.originAccount.balance = 10000;
    ctx.originAccount.frozenBalance = 0;
    await ctx.accountRepo.save(ctx.originAccount);

    ctx.destinationAccount.balance = 5000;
    ctx.destinationAccount.frozenBalance = 0;
    await ctx.accountRepo.save(ctx.destinationAccount);
  });

  afterAll(async () => {
    await teardownTestContext(ctx);
    await ctx.app.close();
  });

  it('No debe permitir doble gasto al enviar peticiones concurrentes que superan el saldo', async () => {
    const makeRequest = () =>
      request(ctx.app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${ctx.authToken}`)
        .send({
          amount: 5000.0,
          originAddress: ctx.originAccount.address,
          destinationAddress: ctx.destinationAccount.address,
        });

    const results = await Promise.all([
      makeRequest(),
      makeRequest(),
      makeRequest(),
    ]);

    const successful = results.filter((r) => r.status === 201);
    const failed = results.filter((r) => r.status !== 201);

    const originAfter = await ctx.accountRepo.findOne({ where: { id: ctx.originAccount.id } });
    const currentBalance = Number(originAfter!.balance);
    const currentFrozen = Number(originAfter!.frozenBalance);

    expect(currentBalance).toBeGreaterThanOrEqual(0);
  });
});
