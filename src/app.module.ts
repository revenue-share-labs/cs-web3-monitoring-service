import { AvroModule } from './shared/services/avro/avro.module';
import monitoringConfig from './shared/common/configs/monitoring.config';
import alchemyConfig from './shared/common/configs/alchemy.config';
import { Module } from '@nestjs/common';
import baseConfig from './shared/common/configs/base.config';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/services/prisma/prisma.module';
import { HealthModule } from './shared/services/health/health.module';
import { CoreModule } from './core/core.module';
import avroConfig from './shared/common/configs/avro.config';
import defenderConfig from './shared/common/configs/defender.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        baseConfig,
        alchemyConfig,
        monitoringConfig,
        avroConfig,
        defenderConfig,
      ],
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? `/etc/conf/contract-svc/.${process.env.NODE_ENV}.env`
          : `.${process.env.NODE_ENV}.env`,
    }),
    PrismaModule,
    HealthModule,
    CoreModule,
    AvroModule,
  ],
})
export class AppModule {}
