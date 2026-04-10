import request from 'supertest';
import { TransactionStatus } from '@transactions/enums/transaction.enum';
import { createTestApp, setupTestContext, clearTransactions, teardownTestContext, TestContext, ResponseStatusCode } from '../helpers/test-setup';

describe('POST /transactions', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    const app = await createTestApp();
    ctx = await setupTestContext(app);
  });

  beforeEach(async () => {
    await clearTransactions(ctx.transactionRepo);
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

  // ─── Fondos insuficientes ─────────────────────────────────────────────────
  it('Debe retornar 400 si la cuenta de origen no tiene saldo suficiente', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .send({
        amount: 999999,
        originAddress: ctx.originAccount.address,
        destinationAddress: ctx.destinationAccount.address,
      });

    expect(res.status).toBe(ResponseStatusCode.BAD_REQUEST);
    expect(res.body.success).toBe(false);

    // Verificar que el saldo no fue modificado
    const accountAfter = await ctx.accountRepo.findOne({ where: { id: ctx.originAccount.id } });
    expect(Number(accountAfter!.balance)).toBe(10000);
    expect(Number(accountAfter!.frozenBalance)).toBe(0);
  });

  // ─── Transacción automática (monto <= threshold) ──────────────────────────
  it('Debe crear y confirmar la transacción automáticamente si el monto es <= 5000', async () => {
    const amount = 1000;

    const res = await request(ctx.app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .send({
        amount,
        originAddress: ctx.originAccount.address,
        destinationAddress: ctx.destinationAccount.address,
      });

    expect(res.status).toBe(ResponseStatusCode.CREATED);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(TransactionStatus.CONFIRMED);
    expect(Number(res.body.data.amount)).toBe(amount);

    // Verificar saldos
    const originAfter = await ctx.accountRepo.findOne({ where: { id: ctx.originAccount.id } });
    const destAfter = await ctx.accountRepo.findOne({ where: { id: ctx.destinationAccount.id } });

    expect(Number(originAfter!.balance)).toBe(10000.0 - amount);
    expect(Number(destAfter!.balance)).toBe(5000.0 + amount);
    expect(Number(originAfter!.frozenBalance)).toBe(0);
  });

  // ─── Transacción pendiente (monto > threshold) ────────────────────────────
  it('Debe crear la transacción en estado PENDING y congelar saldo si el monto es > 5000', async () => {
    const amount = 6000.0;

    const res = await request(ctx.app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .send({
        amount,
        originAddress: ctx.originAccount.address,
        destinationAddress: ctx.destinationAccount.address,
      });

    expect(res.status).toBe(ResponseStatusCode.CREATED);
    expect(res.body.data.status).toBe(TransactionStatus.PENDING);

    const originAfter = await ctx.accountRepo.findOne({ where: { id: ctx.originAccount.id } });
    expect(Number(originAfter!.frozenBalance)).toBe(amount);
    expect(Number(originAfter!.balance)).toBe(10000.0);

    const destAfter = await ctx.accountRepo.findOne({ where: { id: ctx.destinationAccount.id } });
    expect(Number(destAfter!.balance)).toBe(5000.0);
  });

  // ─── Cuentas inexistentes ─────────────────────────────────────────────────
  it('Debe retornar 404 si la cuenta de origen no existe', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .send({
        amount: 100,
        originAddress: '0xDIRECCION_INEXISTENTE',
        destinationAddress: ctx.destinationAccount.address,
      });

    expect(res.status).toBe(ResponseStatusCode.NOT_FOUND);
    expect(res.body.success).toBe(false);
  });

  it('Debe retornar 404 si la cuenta de destino no existe', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .send({
        amount: 100,
        originAddress: ctx.originAccount.address,
        destinationAddress: '0xDESTINO_INEXISTENTE',
      });

    expect(res.status).toBe(ResponseStatusCode.NOT_FOUND);
    expect(res.body.success).toBe(false);
  });

  // ─── Validaciones del DTO ─────────────────────────────────────────────────
  it('Debe retornar 400 si no se envían los campos requeridos', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .send({});

    expect(res.status).toBe(ResponseStatusCode.BAD_REQUEST);
    expect(res.body.success).toBe(false);
    expect(res.body.messages.length).toBeGreaterThanOrEqual(1);
  });

  it('Debe retornar 400 si el monto es negativo', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .send({
        amount: -500.0,
        originAddress: ctx.originAccount.address,
        destinationAddress: ctx.destinationAccount.address,
      });

    expect(res.status).toBe(ResponseStatusCode.BAD_REQUEST);
  });

  it('Debe retornar 400 si originAddress y destinationAddress son iguales', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${ctx.authToken}`)
      .send({
        amount: 100.0,
        originAddress: ctx.originAccount.address,
        destinationAddress: ctx.originAccount.address,
      });

    expect(res.status).toBe(ResponseStatusCode.BAD_REQUEST);
  });

  // ─── Sin autenticación ────────────────────────────────────────────────────
  it('Debe retornar 401 si no se envía el token de autenticación', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/transactions')
      .send({
        amount: 100.0,
        originAddress: ctx.originAccount.address,
        destinationAddress: ctx.destinationAccount.address,
      });

    expect(res.status).toBe(ResponseStatusCode.UNAUTHORIZED);
  });
});
