import { NestFactory } from '@nestjs/core';
import { ConfigService, ConfigType } from '@nestjs/config';
import { AppModule } from './app.module';
import baseConfig from './shared/common/configs/base.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['log', 'error', 'warn']
        : ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const base = configService.get<ConfigType<typeof baseConfig>>('base');

  await app.listen(base.port || 3000);
}

bootstrap();
