/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Test, TestingModule } from '@nestjs/testing';
import { CoreService } from './core.service';
import { PrismaService } from '../shared/services/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import alchemyFactories from '../../factories.json';
import { OnchainTransactionCreateRecordSerializer } from '../shared/services/avro/onchain-transaction-create.serializer';
import { RelayerTransactionRecordSerializer } from '../shared/services/avro/relayer-transaction.serializer';

describe('CoreService', () => {
  let coreService: CoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoreService,
        PrismaService,
        OnchainTransactionCreateRecordSerializer,
        RelayerTransactionRecordSerializer,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'alchemy':
                  return {
                    alchemyApiKey: 'alchemyApiKey',
                    network: 'mainnet',
                  };
                case 'monitoring':
                  return {
                    alchemyDelay: 1000,
                    defenderDelay: 1000,
                    runMonitoringImmediately: false,
                  };
                case 'avro':
                  return {
                    schemaRegistryHost: 'http://localhost:8081',
                    onchainTransactionCreateSchemaPath: '/',
                    avroRelayerTransactionSchemaPath: '/',
                  };
                case 'defender':
                  return {
                    apiKey: 'apiKey',
                    apiSecret: 'apiSecret',
                    chainId: 80001,
                  };
                default:
                  return null;
              }
            }),
          },
        },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .overrideProvider(OnchainTransactionCreateRecordSerializer)
      .useValue(mockDeep<OnchainTransactionCreateRecordSerializer>())
      .overrideProvider(RelayerTransactionRecordSerializer)
      .useValue(mockDeep<RelayerTransactionRecordSerializer>())
      .compile();

    coreService = module.get<CoreService>(CoreService);
  });

  it('should be defined', () => {
    expect(coreService).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize monitors', async () => {
      await coreService.onModuleInit();
      expect(coreService['alchemyFactories'].length).toEqual(
        alchemyFactories.length,
      );
    });
  });
});
