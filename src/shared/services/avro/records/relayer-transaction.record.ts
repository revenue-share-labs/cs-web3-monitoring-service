export enum RelayerTransactionRecordStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  SUBMITTED = 'SUBMITTED',
  INMEMPOOL = 'INMEMPOOL',
  MINED = 'MINED',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

export class RelayerTransactionRecord {
  readonly hash: string;
  readonly transactionId: string;
  readonly status: RelayerTransactionRecordStatus;
}
