/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { DefenderMonitor } from './defender-monitor';
import { PrismaClient } from '@prisma/client';
import { sleep } from '../shared/common/utils';
import { RelayerTransactionRecordSerializer } from '../shared/services/avro/relayer-transaction.serializer';
import { Relayer } from 'defender-relay-client';

describe('DefenderMonitor', () => {
  let monitor: DefenderMonitor;

  let mockRelayer: DeepMockProxy<Relayer>;
  let mockPrismaService: DeepMockProxy<PrismaClient>;
  let mockRelayerTransactionRecordSerializer: DeepMockProxy<RelayerTransactionRecordSerializer>;

  beforeEach(async () => {
    mockRelayer = mockDeep<Relayer>();
    mockPrismaService = mockDeep<PrismaClient>();
    mockRelayerTransactionRecordSerializer =
      mockDeep<RelayerTransactionRecordSerializer>();
    //@ts-ignore
    monitor = new DefenderMonitor(
      mockPrismaService,
      mockRelayerTransactionRecordSerializer,
      100,
      80001,
      mockRelayer,
    );
  });

  describe('run', () => {
    it('should correctly execute methods', async () => {
      const spyInit = jest.spyOn(monitor as any, 'init');
      spyInit.mockImplementation(() => {});
      const spyObserveTransactions = jest.spyOn(
        monitor as any,
        'observeTransactions',
      );
      spyObserveTransactions.mockImplementation(() => {});

      await monitor.run();

      expect(spyInit).toBeCalledTimes(1);
      expect(spyObserveTransactions).toBeCalledTimes(1);
    });
  });

  describe('observeTransactions', () => {
    it('should correctly observe transactions', async () => {
      const expectedCreateCall = {
        data: {
          createdAt: undefined,
          hash: '0x231',
          relayerTransactionAvroRecords: {
            create: [
              {
                record: Buffer.from('abc'),
              },
            ],
          },
          status: 'CONFIRMED',
          transactionId: '2921',
        },
      };
      const expectedUpdateCall = {
        data: {
          relayerTransactionAvroRecords: {
            create: [
              {
                record: Buffer.from('abc'),
              },
            ],
          },
          status: 'CONFIRMED',
        },
        where: {
          transactionId: '8762921',
        },
      };

      const spyInit = jest.spyOn(monitor as any, 'init');
      spyInit.mockImplementation(() => {});
      mockPrismaService.$transaction.mockImplementation((callback) =>
        //@ts-ignore
        callback(mockPrismaService),
      );
      //@ts-ignore
      const spyRelayerTransactionCreate = jest.spyOn(
        mockPrismaService.relayerTransaction,
        'create',
      );
      //@ts-ignore
      const spyRelayerTransactionUpdate = jest.spyOn(
        mockPrismaService.relayerTransaction,
        'update',
      );
      mockRelayer.list.mockResolvedValue([
        //@ts-ignore
        {
          chainId: 80001,
          status: 'confirmed',
          transactionId: '2921',
          hash: '0x231',
        },
        //@ts-ignore
        {
          chainId: 80001,
          status: 'confirmed',
          transactionId: '8762921',
          hash: '0x971',
        },
      ]);
      mockRelayerTransactionRecordSerializer.serialize.mockResolvedValue(
        Buffer.from('abc'),
      );
      mockPrismaService.relayerTransaction.findMany.mockResolvedValue([
        {
          id: 'id',
          status: 'PENDING',
          transactionId: '8762921',
          hash: '0x971',
          createdAt: new Date(),
        },
      ]);

      await monitor.run();

      await sleep(100);
      monitor['observe'] = false;

      expect(spyRelayerTransactionCreate.mock.calls[0][0]).toStrictEqual(
        expectedCreateCall,
      );
      expect(spyRelayerTransactionUpdate.mock.calls[0][0]).toStrictEqual(
        expectedUpdateCall,
      );
      expect(spyInit).toHaveBeenCalled();
    });
  });
});
