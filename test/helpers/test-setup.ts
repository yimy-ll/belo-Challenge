import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { DataSource, Repository } from 'typeorm';
import { Account } from '@accounts/entities/account.entity';
import { User } from '@users/entities/user.entity';
import { Currency } from '@currency/entities/currency.entity';
import { Transaction } from '@transactions/entities/transaction.entity';
import { AllExceptionsFilter } from '@core/filters/all-exceptions.filter';
import * as bcrypt from 'bcrypt';

export const TEST_PASSWORD = 'test1234';

export interface TestContext {
  app: INestApplication<App>;
  dataSource: DataSource;
  userRepo: Repository<User>;
  currencyRepo: Repository<Currency>;
  accountRepo: Repository<Account>;
  transactionRepo: Repository<Transaction>;
  testUser: User;
  testCurrency: Currency;
  originAccount: Account;
  destinationAccount: Account;
  authToken: string;
}

// ─── Inicializar la app de NestJS ─────────────────────────────────────────────
export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.init();
  return app;
}

export function getRepositories(app: INestApplication) {
  const dataSource = app.get(DataSource);
  return {
    dataSource,
    userRepo: dataSource.getRepository(User),
    currencyRepo: dataSource.getRepository(Currency),
    accountRepo: dataSource.getRepository(Account),
    transactionRepo: dataSource.getRepository(Transaction),
  };
}

export async function createTestUser(userRepo: Repository<User>, overrides: Partial<User> = {}): Promise<User> {
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
  const user = userRepo.create({
    name: 'Test User',
    email: `test-${Date.now()}-${Math.random().toString(36).slice(2)}@e2e.com`,
    password: hashedPassword,
    ...overrides,
  });
  return userRepo.save(user);
}

export async function createTestCurrency(currencyRepo: Repository<Currency>, overrides: Partial<Currency> = {}): Promise<Currency> {
  const currency = currencyRepo.create({
    code: `TST-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'CRYPTO' as any,
    precision: 2,
    ...overrides,
  });
  return currencyRepo.save(currency);
}

export async function createTestAccount(
  accountRepo: Repository<Account>,
  user: User,
  currency: Currency,
  overrides: Partial<Account> = {},
): Promise<Account> {
  const account = accountRepo.create({
    balance: 10000,
    frozenBalance: 0,
    address: `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`,
    userId: user.id,
    currencyId: currency.id,
    ...overrides,
  });
  return accountRepo.save(account);
}

export async function getAuthToken(app: INestApplication, email: string, password: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);
  return res.body.access_token;
}

export enum ResponseStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

export async function clearTransactions(transactionRepo: Repository<Transaction>) {
  await transactionRepo.createQueryBuilder().delete().from(Transaction).execute();
}

/**
 * Limpia todos los datos creados por la suite: transacciones, cuentas, moneda y usuario.
 * Llamar en afterAll() antes de ctx.app.close() para garantizar aislamiento entre suites.
 */
export async function teardownTestContext(ctx: TestContext) {
  const { transactionRepo, accountRepo, currencyRepo, userRepo, testUser, testCurrency } = ctx;

  // Orden: primero transacciones (FK -> accounts), luego cuentas (FK -> users/currencies)
  await transactionRepo.createQueryBuilder().delete().from(Transaction).execute();
  await accountRepo.delete({ userId: testUser.id });
  await currencyRepo.delete({ id: testCurrency.id });
  await userRepo.delete({ id: testUser.id });
}


export async function setupTestContext(app: INestApplication): Promise<TestContext> {
  const repos = getRepositories(app);

  await repos.transactionRepo.createQueryBuilder().delete().from(Transaction).execute();

  const testUser = await createTestUser(repos.userRepo);
  const testCurrency = await createTestCurrency(repos.currencyRepo);

  const originAccount = await createTestAccount(repos.accountRepo, testUser, testCurrency, {
    balance: 10000,
    frozenBalance: 0,
  });

  const destinationAccount = await createTestAccount(repos.accountRepo, testUser, testCurrency, {
    balance: 5000,
    frozenBalance: 0,
  });

  const authToken = await getAuthToken(app, testUser.email, TEST_PASSWORD);

  return {
    app,
    ...repos,
    testUser,
    testCurrency,
    originAccount,
    destinationAccount,
    authToken,
  };
}
