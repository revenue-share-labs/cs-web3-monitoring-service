import { OnchainTransactionCreateRecordSerializer } from '../shared/services/avro/onchain-transaction-create.serializer';
import { ConfigService, ConfigType } from '@nestjs/config';
import { Alchemy } from 'alchemy-sdk';
import { PrismaService } from '../shared/services/prisma/prisma.service';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import factories from '../../factories.json';
import alchemyConfig from '../shared/common/configs/alchemy.config';
import monitoringConfig from '../shared/common/configs/monitoring.config';
import { Factory, AlchemyMonitor } from './alchemy-monitor';
import { DefenderMonitor } from './defender-monitor';
import defenderConfig from '../shared/common/configs/defender.config';
import { RelayerTransactionRecordSerializer } from '../shared/services/avro/relayer-transaction.serializer';
import { Relayer } from 'defender-relay-client';

@Injectable()
export class CoreService implements OnModuleInit {
  private readonly logger = new Logger(CoreService.name);
  private readonly alchemyMonitors: AlchemyMonitor[] = [];

  private readonly alchemyFactories: Factory[];
  // TODO: add calculation in case of false
  private readonly runMonitoringImmediately: boolean;

  private defenderMonitor: DefenderMonitor;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly onchainTransactionCreateRecordSerializer: OnchainTransactionCreateRecordSerializer,
    private readonly relayerTransactionRecordSerializer: RelayerTransactionRecordSerializer,
  ) {
    const monitoring =
      this.configService.get<ConfigType<typeof monitoringConfig>>('monitoring');
    this.runMonitoringImmediately = monitoring.runMonitoringImmediately;
    this.alchemyFactories = factories as Factory[];
  }

  async onModuleInit(): Promise<void> {
    await this.initAlchemyMonitors();
    await this.initDefenderMonitors();
  }

  async initAlchemyMonitors(): Promise<void> {
    this.logger.log('Loading Alchemy configs');
    const alchemyConf =
      this.configService.get<ConfigType<typeof alchemyConfig>>('alchemy');
    const monitoringConf =
      this.configService.get<ConfigType<typeof monitoringConfig>>('monitoring');

    this.logger.log('Initializing Alchemy factories');
    const alchemy = new Alchemy({
      apiKey: alchemyConf.apiKey,
      network: alchemyConf.network,
    });
    for (const factory of this.alchemyFactories) {
      const monitor = new AlchemyMonitor(
        alchemy,
        factory,
        monitoringConf.alchemyDelay,
        this.prismaService,
        this.onchainTransactionCreateRecordSerializer,
      );
      if (this.runMonitoringImmediately) {
        await monitor.run();
      }
      this.alchemyMonitors.push(monitor);
      this.logger.log(`Alchemy monitor ${factory.address} was initialized`);
    }

    this.logger.log(
      `All Alchemy monitors were initialized, total: ${this.alchemyFactories.length}`,
    );
  }

  async initDefenderMonitors(): Promise<void> {
    this.logger.log('Loading Defender configs');
    const defenderConf =
      this.configService.get<ConfigType<typeof defenderConfig>>('defender');
    const monitoringConf =
      this.configService.get<ConfigType<typeof monitoringConfig>>('monitoring');

    const relayer = new Relayer({
      apiKey: defenderConf.apiKey,
      apiSecret: defenderConf.apiSecret,
    });
    this.defenderMonitor = new DefenderMonitor(
      this.prismaService,
      this.relayerTransactionRecordSerializer,
      monitoringConf.defenderDelay,
      defenderConf.chainId,
      relayer,
    );

    await this.defenderMonitor.run();

    this.logger.log(`Defender monitor was initialized`);
  }
}
