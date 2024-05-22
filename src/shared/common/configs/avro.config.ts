import { registerAs } from '@nestjs/config';

export default registerAs('avro', () => ({
  schemaRegistryHost: process.env.AVRO_SCHEMA_REGISTRY,
  onchainTransactionCreateSchemaPath:
    process.env.AVRO_ONCHAIN_TRANSACTION_CREATE_SCHEMA_PATH,
  avroRelayerTransactionSchemaPath:
    process.env.AVRO_RELAYER_TRANSACTION_SCHEMA_PATH,
}));
