import { Test } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from './prisma.module';

describe('StorageModule', () => {
  it('should compile the module', async () => {
    const prismaModule: PrismaModule = await Test.createTestingModule({
      imports: [PrismaModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    expect(prismaModule).toBeDefined();
  });
});
