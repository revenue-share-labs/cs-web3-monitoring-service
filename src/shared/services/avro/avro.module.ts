import { RelayerTransactionRecordSerializer } from './relayer-transaction.serializer';
import { OnchainTransactionCreateRecordSerializer } from './onchain-transaction-create.serializer';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [
    OnchainTransactionCreateRecordSerializer,
    RelayerTransactionRecordSerializer,
  ],
  exports: [
    OnchainTransactionCreateRecordSerializer,
    RelayerTransactionRecordSerializer,
  ],
})
export class AvroModule {}
