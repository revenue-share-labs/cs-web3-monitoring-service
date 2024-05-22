import { Test } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { AppModule } from './app.module';
import { PrismaModule } from './shared/services/prisma/prisma.module';
import { PrismaService } from './shared/services/prisma/prisma.service';

describe('AppModule', () => {
  it('should compile the module', async () => {
    const appModule: AppModule = await Test.createTestingModule({
      imports: [AppModule, PrismaModule],
      providers: [],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    expect(appModule).toBeDefined();
  });
});
