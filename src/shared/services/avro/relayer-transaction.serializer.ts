import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ApacheAvroSerializer } from './avro.serializer';
import { RelayerTransactionRecord } from './records/relayer-transaction.record';
import { ConfigType } from '@nestjs/config';
import avroConfig from '../../common/configs/avro.config';
import fs from 'fs';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';

@Injectable()
export class RelayerTransactionRecordSerializer
  extends ApacheAvroSerializer<RelayerTransactionRecord>
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
      this.avro.avroRelayerTransactionSchemaPath,
      'utf8',
    );
    this.init(schema);
  }
}
