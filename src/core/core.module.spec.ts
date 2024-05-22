import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { PrismaService } from '../shared/services/prisma/prisma.service';
import { CoreModule } from './core.module';

describe('CoreModule', () => {
  it('should compile the module', async () => {
    const coreModule: CoreModule = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: mockDeep<PrismaClient>() },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    expect(coreModule).toBeDefined();
  });
});
