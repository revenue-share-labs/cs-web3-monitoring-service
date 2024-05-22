/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { AlchemyMonitor } from './alchemy-monitor';
import { Factory } from './alchemy-monitor';
import { Alchemy, BigNumber } from 'alchemy-sdk';
import { PrismaClient } from '@prisma/client';
import { sleep } from '../shared/common/utils';
import { OnchainTransactionCreateRecordSerializer } from '../shared/services/avro/onchain-transaction-create.serializer';

describe('AlchemyMonitor', () => {
  let monitor: AlchemyMonitor;

  let alchemy: DeepMockProxy<Alchemy>;
  let mockPrismaService: DeepMockProxy<PrismaClient>;
  let mockOnchainTransactionCreateRecordSerializer: DeepMockProxy<OnchainTransactionCreateRecordSerializer>;

  const mockFactory: Factory = {
    name: 'VALVE',
    address: '0x1',
    version: '1',
    abi: '[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"CreationIdAlreadyProcessed","type":"error"},{"inputs":[],"name":"InvalidFeePercentage","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"oldFee","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newFee","type":"uint256"}],"name":"PlatformFeeChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address payable","name":"oldPlatformWallet","type":"address"},{"indexed":false,"internalType":"address payable","name":"newPlatformWallet","type":"address"}],"name":"PlatformWalletChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"contractAddress","type":"address"},{"indexed":false,"internalType":"address","name":"controller","type":"address"},{"indexed":false,"internalType":"address[]","name":"distributor","type":"address[]"},{"indexed":false,"internalType":"uint256","name":"version","type":"uint256"},{"indexed":false,"internalType":"bool","name":"immutableController","type":"bool"},{"indexed":false,"internalType":"bool","name":"autoNativeTokenDistribution","type":"bool"},{"indexed":false,"internalType":"uint256","name":"minAutoDistributeAmount","type":"uint256"},{"indexed":false,"internalType":"bytes32","name":"creationId","type":"bytes32"}],"name":"RSCValveCreated","type":"event"},{"inputs":[],"name":"contractImplementation","outputs":[{"internalType":"address payable","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"controller","type":"address"},{"internalType":"address[]","name":"distributors","type":"address[]"},{"internalType":"bool","name":"immutableController","type":"bool"},{"internalType":"bool","name":"autoNativeTokenDistribution","type":"bool"},{"internalType":"uint256","name":"minAutoDistributeAmount","type":"uint256"},{"internalType":"address payable[]","name":"initialRecipients","type":"address[]"},{"internalType":"uint256[]","name":"percentages","type":"uint256[]"},{"internalType":"bytes32","name":"creationId","type":"bytes32"}],"internalType":"struct XLARSCValveFactory.RSCCreateData","name":"_data","type":"tuple"}],"name":"createRSCValve","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"platformFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"platformWallet","outputs":[{"internalType":"address payable","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"processedCreationIds","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_fee","type":"uint256"}],"name":"setPlatformFee","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address payable","name":"_platformWallet","type":"address"}],"name":"setPlatformWallet","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]',
  };

  beforeEach(async () => {
    alchemy = mockDeep<Alchemy>();
    mockPrismaService = mockDeep<PrismaClient>();
    mockOnchainTransactionCreateRecordSerializer =
      mockDeep<OnchainTransactionCreateRecordSerializer>();
    //@ts-ignore
    monitor = new AlchemyMonitor(
      alchemy,
      mockFactory,
      100,
      mockPrismaService,
      mockOnchainTransactionCreateRecordSerializer,
    );
  });

  describe('run', () => {
    it('should correctly execute methods', async () => {
      const spyInit = jest.spyOn(monitor as any, 'init');
      spyInit.mockImplementation(() => {});
      const spyObserveMinedTransactions = jest.spyOn(
        monitor as any,
        'observeMinedTransactions',
      );
      spyObserveMinedTransactions.mockImplementation(() => {});

      await monitor.run();

      expect(spyInit).toBeCalledTimes(1);
      expect(spyObserveMinedTransactions).toBeCalledTimes(1);
    });
  });

  describe('init', () => {
    it('should set blockNumber 0x0 when db is empty', async () => {
      const spyObserveMinedTransactions = jest.spyOn(
        monitor as any,
        'observeMinedTransactions',
      );
      spyObserveMinedTransactions.mockImplementation(() => {});
      //@ts-ignore
      mockPrismaService.block.findFirst.mockResolvedValue(null);
      await monitor.run();

      expect(monitor['blockNumber']).toEqual(0n);
    });

    it('should set blockNumber from value exists in db', async () => {
      const spyObserveMinedTransactions = jest.spyOn(
        monitor as any,
        'observeMinedTransactions',
      );
      spyObserveMinedTransactions.mockImplementation(() => {});
      //@ts-ignore
      mockPrismaService.block.findFirst.mockResolvedValue({
        number: 1000n,
      });
      await monitor.run();

      expect(monitor['blockNumber']).toEqual(1001n);
    });
  });

  describe('observeTransactions', () => {
    it('should correctly observe transactions', async () => {
      const expectedCreateCall = {
        data: {
          hash: '0x3',
          from: '0x35',
          factory: {
            type: 'VALVE',
            version: '1',
            abi: '[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"CreationIdAlreadyProcessed","type":"error"},{"inputs":[],"name":"InvalidFeePercentage","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"oldFee","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newFee","type":"uint256"}],"name":"PlatformFeeChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address payable","name":"oldPlatformWallet","type":"address"},{"indexed":false,"internalType":"address payable","name":"newPlatformWallet","type":"address"}],"name":"PlatformWalletChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"contractAddress","type":"address"},{"indexed":false,"internalType":"address","name":"controller","type":"address"},{"indexed":false,"internalType":"address[]","name":"distributor","type":"address[]"},{"indexed":false,"internalType":"uint256","name":"version","type":"uint256"},{"indexed":false,"internalType":"bool","name":"immutableController","type":"bool"},{"indexed":false,"internalType":"bool","name":"autoNativeTokenDistribution","type":"bool"},{"indexed":false,"internalType":"uint256","name":"minAutoDistributeAmount","type":"uint256"},{"indexed":false,"internalType":"bytes32","name":"creationId","type":"bytes32"}],"name":"RSCValveCreated","type":"event"},{"inputs":[],"name":"contractImplementation","outputs":[{"internalType":"address payable","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"controller","type":"address"},{"internalType":"address[]","name":"distributors","type":"address[]"},{"internalType":"bool","name":"immutableController","type":"bool"},{"internalType":"bool","name":"autoNativeTokenDistribution","type":"bool"},{"internalType":"uint256","name":"minAutoDistributeAmount","type":"uint256"},{"internalType":"address payable[]","name":"initialRecipients","type":"address[]"},{"internalType":"uint256[]","name":"percentages","type":"uint256[]"},{"internalType":"bytes32","name":"creationId","type":"bytes32"}],"internalType":"struct XLARSCValveFactory.RSCCreateData","name":"_data","type":"tuple"}],"name":"createRSCValve","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"platformFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"platformWallet","outputs":[{"internalType":"address payable","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"processedCreationIds","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_fee","type":"uint256"}],"name":"setPlatformFee","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address payable","name":"_platformWallet","type":"address"}],"name":"setPlatformWallet","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]',
          },
          timestamp: 12345,
          status: 'MINED',
          data: '0x02afbfe10000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000091b77e5e5d9a000000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000007fdb908aa02d3a1f8b7f9d882ea67b68ab355dc100000000000000000000000000000000000000000000000000000000000000010000000000000000000000007fdb908aa02d3a1f8b7f9d882ea67b68ab355dc100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000989680',
          value: 0,
          logs: [{ data: '0x9291', topics: ['0x92'] }],
          block: {
            connectOrCreate: {
              where: { number: 1 },
              create: { number: 1, timestamp: 12345 },
            },
          },
          transactionCreateAvroRecord: {
            create: {
              record: Buffer.from('abc'),
            },
          },
        },
      };

      const spyInit = jest.spyOn(monitor as any, 'init');
      spyInit.mockImplementation(() => {});
      mockPrismaService.$transaction.mockImplementation((callback) =>
        //@ts-ignore
        callback(mockPrismaService),
      );
      //@ts-ignore
      const spyTransactionCreate = jest.spyOn(
        mockPrismaService.transaction,
        'create',
      );
      alchemy.core.getAssetTransfers.mockResolvedValue({
        transfers: [
          //@ts-ignore
          {
            hash: 'txHash1',
            blockNum: '0x1',
          },
        ],
      });
      alchemy.core.getBlock.mockResolvedValue(
        // @ts-ignore
        { timestamp: 12345, number: 1 },
      );
      alchemy.core.getTransaction.mockResolvedValue(
        //@ts-ignore
        {
          from: '0x35',
          hash: '0x3',
          data: '0x02afbfe10000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000091b77e5e5d9a000000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000007fdb908aa02d3a1f8b7f9d882ea67b68ab355dc100000000000000000000000000000000000000000000000000000000000000010000000000000000000000007fdb908aa02d3a1f8b7f9d882ea67b68ab355dc100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000989680',
          value: BigNumber.from(0),
        },
      );
      alchemy.core.getTransactionReceipt.mockResolvedValue(
        //@ts-ignore
        {
          //@ts-ignore
          logs: [{ data: '0x9291', topics: ['0x92'] }],
        },
      );
      mockOnchainTransactionCreateRecordSerializer.serialize.mockResolvedValue(
        Buffer.from('abc'),
      );

      await monitor.run();

      await sleep(100);
      monitor['observe'] = false;

      expect(spyTransactionCreate.mock.calls[0][0]).toStrictEqual(
        expectedCreateCall,
      );
      expect(spyInit).toHaveBeenCalled();
    });
  });
});
