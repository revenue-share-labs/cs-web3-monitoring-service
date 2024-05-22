import { Logger } from '@nestjs/common';
import { sleep } from '../shared/common/utils';
import { Relayer } from 'defender-relay-client';
import { PrismaService } from '../shared/services/prisma/prisma.service';
import { Prisma, RelayerTransactionStatus } from '@prisma/client';
import { RelayerTransactionRecordSerializer } from '../shared/services/avro/relayer-transaction.serializer';
import { RelayerTransactionRecordStatus } from '../shared/services/avro/records/relayer-transaction.record';

export class DefenderMonitor {
  private readonly logger: Logger = new Logger(DefenderMonitor.name);
  // TODO: add external control
  private observe = true;
  private loops = 0n;
  private since: Date = null;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly relayerTransactionRecordSerializer: RelayerTransactionRecordSerializer,
    private readonly delay: number,
    private readonly chainId: number,
    private readonly relayer: Relayer,
  ) {}

  async run(): Promise<void> {
    await this.init();
    this.observeTransactions();
  }

  private async init(): Promise<void> {
    this.logger.log('Initializing since date');

    const earliestDelayerTransactionNotConfirmed =
      await this.prismaService.relayerTransaction.findFirst({
        where: {
          status: { not: RelayerTransactionRecordStatus.CONFIRMED },
        },
        orderBy: [{ createdAt: 'asc' }],
      });

    const latestRelayerTransactionConfirmed =
      earliestDelayerTransactionNotConfirmed
        ? null
        : await this.prismaService.relayerTransaction.findFirst({
            orderBy: [{ createdAt: 'desc' }],
          });

    this.since =
      earliestDelayerTransactionNotConfirmed?.createdAt ??
      latestRelayerTransactionConfirmed?.createdAt;

    this.logger.log(`Current since date is: ${this.since}`);
  }

  private async observeTransactions(): Promise<void> {
    while (this.observe) {
      try {
        this.logger.log(
          `Observing transactions from defender since: ${this.since}`,
        );

        const transactionsFromRelayer = (
          await this.relayer.list({ since: this.since })
        ).filter((transaction) => transaction.chainId === this.chainId);

        const transactionIdsFromRelayer = transactionsFromRelayer.map(
          (transaction) => transaction.transactionId,
        );

        const transactionsFromDb =
          await this.prismaService.relayerTransaction.findMany({
            where: { transactionId: { in: transactionIdsFromRelayer } },
          });

        const transactionIdsFromDb = transactionsFromDb.map(
          (transaction) => transaction.transactionId,
        );

        const relayerTransactionsCreateInput: Prisma.RelayerTransactionCreateInput[] =
          [];
        const relayerTransactionsUpdateInput: Prisma.RelayerTransactionUpdateArgs[] =
          [];

        for (const transaction of transactionsFromRelayer) {
          const relayerTransactionRecord =
            await this.relayerTransactionRecordSerializer.serialize({
              hash: transaction.hash,
              transactionId: transaction.transactionId,
              status:
                transaction.status.toUpperCase() as RelayerTransactionRecordStatus,
            });
          const input = {
            hash: transaction.hash,
            transactionId: transaction.transactionId,
            status:
              transaction.status.toUpperCase() as RelayerTransactionStatus,
            createdAt: transaction.createdAt,
            relayerTransactionAvroRecords: {
              create: [{ record: relayerTransactionRecord }],
            },
          };

          if (!transactionIdsFromDb.includes(transaction.transactionId)) {
            relayerTransactionsCreateInput.push(input);
          } else {
            const transactionFromDb = transactionsFromDb.find(
              (transactionFromDb) =>
                transactionFromDb.transactionId === transaction.transactionId,
            );
            if (transactionFromDb.status.toLowerCase() !== transaction.status) {
              relayerTransactionsUpdateInput.push({
                data: {
                  status: input.status,
                  relayerTransactionAvroRecords:
                    input.relayerTransactionAvroRecords,
                },
                where: {
                  transactionId: input.transactionId,
                },
              });
            }
          }
        }

        if (relayerTransactionsCreateInput.length) {
          await this.prismaService.$transaction(async (tx) => {
            const updates = relayerTransactionsCreateInput.map((input) =>
              tx.relayerTransaction.create({ data: input }),
            );
            await Promise.all(updates);
          });
        }

        if (relayerTransactionsUpdateInput.length) {
          await this.prismaService.$transaction(async (tx) => {
            const updates = relayerTransactionsUpdateInput.map((input) =>
              tx.relayerTransaction.update(input),
            );
            await Promise.all(updates);
          });
        }

        if (
          relayerTransactionsCreateInput.length ||
          relayerTransactionsUpdateInput.length
        ) {
          this.logger.log(
            `Saved ${relayerTransactionsCreateInput.length} new transactions`,
          );
          this.logger.log(
            `Updated ${relayerTransactionsUpdateInput.length} new transactions`,
          );
          await this.init();
        } else {
          this.logger.log('No transactions were found for create or update');
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
