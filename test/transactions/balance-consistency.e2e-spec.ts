import request from 'supertest';
import { TransactionStatus } from '@transactions/enums/transaction.enum';
import { createTestApp, setupTestContext, clearTransactions, teardownTestContext, TestContext, ResponseStatusCode } from '../helpers/test-setup';

describe('Consistencia de saldos', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    const app = await createTestApp();
    ctx = await setupTestContext(app);
  });

  beforeEach(async () => {
    await clearTransactions(ctx.transactionRepo);

    // Resetear saldos
    ctx.originAccount.balance = 10000.52;
    ctx.originAccount.frozenBalance = 0;
    await ctx.accountRepo.save(ctx.originAccount);

    ctx.destinationAccount.balance = 5000.12;
    ctx.destinationAccount.frozenBalance = 0;
    await ctx.accountRepo.save(ctx.destinationAccount);
  });

  afterAll(async () => {
    await teardownTestContext(ctx);
    await ctx.app.close();
  });

  it('El saldo congelado debe impedir una segunda transacción que exceda los fondos disponibles', async () => {
    // Balance origen: 10000.52
    // Primera tx de 6000.12 → PENDING → congela 6000.12. Disponible: 4000.40
    await request(ctx.app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .send({
        amount: 6000.12,
        originAddress: ctx.originAccount.address,
        destinationAddress: ctx.destinationAccount.address,
      })
      .expect(ResponseStatusCode.CREATED);

    // Segunda tx de 5000.22 → debe fallar (disponible 4000.40 < 5000.22)
    const res = await request(ctx.app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .send({
        amount: 5000.22,
        originAddress: ctx.originAccount.address,
        destinationAddress: ctx.destinationAccount.address,
      });

    expect(res.status).toBe(ResponseStatusCode.BAD_REQUEST);
    expect(res.body.success).toBe(false);
  });

  it('Después de rechazar una transacción PENDING, el saldo se libera y permite nuevas transacciones', async () => {
    // Balance origen: 10000.52
    // Primera tx de 8000.12 → PENDING → disponible: 2000.40
    const createRes = await request(ctx.app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .send({
        amount: 8000.12,
        originAddress: ctx.originAccount.address,
        destinationAddress: ctx.destinationAccount.address,
      })
      .expect(ResponseStatusCode.CREATED);

    const txId = createRes.body.data.id;

    // Segunda tx de 5000.22 → debe fallar (disponible 2000.40 < 5000.22)
    const failRes = await request(ctx.app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .send({
        amount: 5000.22,
        originAddress: ctx.originAccount.address,
        destinationAddress: ctx.destinationAccount.address,
      });
    expect(failRes.status).toBe(ResponseStatusCode.BAD_REQUEST);

    // Rechazar la primera → se liberan 8000.12, disponible vuelve a 10000.52
    await request(ctx.app.getHttpServer())
      .patch(`/transactions/${txId}/reject`)
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .expect(ResponseStatusCode.OK);

    // Ahora sí debe funcionar: 3000.0 <= threshold (5000) → CONFIRMED
    const successRes = await request(ctx.app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .send({
        amount: 3000.0,
        originAddress: ctx.originAccount.address,
        destinationAddress: ctx.destinationAccount.address,
      });

    expect(successRes.status).toBe(ResponseStatusCode.CREATED);
    expect(successRes.body.data.status).toBe(TransactionStatus.CONFIRMED);
  });

  it('La suma total del sistema debe permanecer constante después de múltiples transacciones', async () => {
    // Calcular suma total antes
    const originBefore = await ctx.accountRepo.findOne({ where: { id: ctx.originAccount.id } });
    const destBefore = await ctx.accountRepo.findOne({ where: { id: ctx.destinationAccount.id } });
    const totalBefore = Number(originBefore!.balance) + Number(destBefore!.balance);

    // Ejecutar varias transacciones automáticas (monto <= 5000 → CONFIRMED)
    await request(ctx.app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .send({
        amount: 1000.0,
        originAddress: ctx.originAccount.address,
        destinationAddress: ctx.destinationAccount.address,
      })
      .expect(ResponseStatusCode.CREATED);

    await request(ctx.app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .send({
        amount: 2000.0,
        originAddress: ctx.originAccount.address,
        destinationAddress: ctx.destinationAccount.address,
      })
      .expect(ResponseStatusCode.CREATED);

    // Verificar que la suma total es la misma (toBeCloseTo evita errores de precisión float)
    const originAfter = await ctx.accountRepo.findOne({ where: { id: ctx.originAccount.id } });
    const destAfter = await ctx.accountRepo.findOne({ where: { id: ctx.destinationAccount.id } });
    const totalAfter = Number(originAfter!.balance) + Number(destAfter!.balance);

    expect(totalAfter).toBeCloseTo(totalBefore, 2);
  });
});


