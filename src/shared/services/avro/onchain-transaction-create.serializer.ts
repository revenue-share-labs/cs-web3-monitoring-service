import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ApacheAvroSerializer } from './avro.serializer';
import { OnchainTransactionCreateRecord } from './records/onchain-transaction-create.record';
import { ConfigType } from '@nestjs/config';
import avroConfig from '../../common/configs/avro.config';
import fs from 'fs';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';

@Injectable()
export class OnchainTransactionCreateRecordSerializer
  extends ApacheAvroSerializer<OnchainTransactionCreateRecord>
  implements OnModuleInit
{
  constructor(
    @Inject(avroConfig.KEY)
    private avro: ConfigType<typeof avroConfig>,
  ) {
    super(new SchemaRegistry({ host: avro.schemaRegistryHost }));
  }

  async onModuleInit(): Promise<void> {
    const schema = fs.readFileSync(
      this.avro.onchainTransactionCreateSchemaPath,
      'utf8',
    );
    this.init(schema);
  }
}
