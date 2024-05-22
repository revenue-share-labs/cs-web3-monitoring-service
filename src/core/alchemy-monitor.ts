import {
  OnchainTransactionCreateRecord,
  OnchainContractCreateTransactionRecordChain,
  OnchainContractCreateTransactionRecordStatus,
} from '../shared/services/avro/records/onchain-transaction-create.record';
import { Logger } from '@nestjs/common';
import {
  Prisma,
  Transaction,
  TransactionLog,
  TransactionStatus,
} from '@prisma/client';
import {
  Alchemy,
  Utils,
  AssetTransfersCategory,
  AssetTransfersResult,
  TransactionReceipt,
} from 'alchemy-sdk';
import { sleep } from '../shared/common/utils';
import { PrismaService } from '../shared/services/prisma/prisma.service';
import { ApacheAvroSerializer } from '../shared/services/avro/avro.serializer';

export interface Factory {
  readonly name: string;
  readonly address: string;
  readonly version: string;
  readonly abi: string;
}

export class AlchemyMonitor {
  private readonly logger: Logger;
  // TODO: add external control
  private observe = true;
  private loops = 0n;
  private blockNumber: bigint;

  constructor(
    private readonly alchemy: Alchemy,
    private readonly factory: Factory,
    private readonly delay: number,
    private readonly prismaService: PrismaService,
    private readonly apacheAvroSerializer: ApacheAvroSerializer<OnchainTransactionCreateRecord>,
  ) {
    this.logger = new Logger(`${AlchemyMonitor.name} ${factory.address}`);
  }

  async run(): Promise<void> {
    await this.init();
    this.observeMinedTransactions();
  }

  private async init(): Promise<void> {
    this.logger.log('Initializing block number');
    const block = await this.prismaService.block.findFirst({
      orderBy: [{ number: 'desc' }],
    });
    if (block) {
      this.logger.log(`Latest block number from db is: ${block.number}`);
      this.blockNumber = block.number + 1n;
    } else {
      this.blockNumber = BigInt('0x0');
    }
    this.logger.log(`Current block number is: ${this.blockNumber}`);
  }

  private async observeMinedTransactions(): Promise<void> {
    while (this.observe) {
      try {
        this.logger.log(
          `Observing mined transactions from block number: ${this.blockNumber}`,
        );

        // TODO: paginate
        const { transfers } = await this.alchemy.core.getAssetTransfers({
          fromBlock: Utils.hexlify(Number(this.blockNumber)),
          toBlock: 'latest',
          toAddress: this.factory.address,
          excludeZeroValue: false,
          category: [AssetTransfersCategory.EXTERNAL],
        });

        const getLogs = (
          transactionReceipt: TransactionReceipt,
        ): TransactionLog[] =>
          transactionReceipt.logs.map((log) => ({
            data: log.data,
            topics: log.topics,
          }));

        const processTransfer = async (
          transfer: AssetTransfersResult,
        ): Promise<Prisma.TransactionCreateInput> => {
          const block = await this.alchemy.core.getBlock(transfer.blockNum);
          const transaction = await this.alchemy.core.getTransaction(
            transfer.hash,
          );
          const transactionReceipt =
            await this.alchemy.core.getTransactionReceipt(transfer.hash);
          const logs = getLogs(transactionReceipt);

          const transactionCreateAvroData =
            await this.apacheAvroSerializer.serialize({
              hash: transaction.hash,
              from: transaction.from,
              chain:
                OnchainContractCreateTransactionRecordChain.ETHEREUM_GOERLI,
              factory: this.factory.name,
              factoryVersion: this.factory.version,
              factoryAbi: this.factory.abi,
              data: transaction.data,
              value: transaction.value.toNumber(),
              logs,
              status:
                TransactionStatus.MINED as OnchainContractCreateTransactionRecordStatus,
            });

          return {
            hash: transaction.hash,
            from: transaction.from,
            factory: {
              type: this.factory.name,
              version: this.factory.version,
              abi: this.factory.abi,
            },
            data: transaction.data,
            value: transaction.value.toNumber(),
            logs,
            timestamp: block.timestamp,
            status: TransactionStatus.MINED,
            block: {
              connectOrCreate: {
                where: { number: block.number },
                create: {
                  number: block.number,
                  timestamp: block.timestamp,
                },
              },
            },
            transactionCreateAvroRecord: {
              create: { record: transactionCreateAvroData },
            },
          };
        };

        const transactions = await Promise.all(transfers.map(processTransfer));

        if (transactions.length) {
          await this.prismaService.$transaction(async (tx) => {
            const creates = transactions.map((transaction) =>
              tx.transaction.create({ data: transaction }),
            );
            await Promise.all(creates);
          });
          await this.init();
          this.logger.log(
            `Saved ${transactions.length} new transactions, block number: ${this.blockNumber}`,
          );
        } else {
          this.logger.log(
            `No transactions were found from block number: ${this.blockNumber}`,
          );
        }
      } catch (err) {
        this.logger.error(err);
      } finally {
        this.loops = this.loops + 1n;
        try {
          await sleep(this.delay);
        } catch (err) {
          this.logger.error(err);
        }
      }
    }
  }
}
