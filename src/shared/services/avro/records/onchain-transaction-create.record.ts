export enum OnchainContractCreateTransactionRecordChain {
  ETHEREUM = 'ETHEREUM',
  ETHEREUM_GOERLI = 'ETHEREUM_GOERLI',
  POLYGON = 'POLYGON',
  POLYGON_MUMBAI = 'POLYGON_MUMBAI',
}

export enum OnchainContractCreateTransactionRecordStatus {
  PENDING = 'PENDING',
  MINED = 'MINED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export class OnchainTransactionLog {
  readonly data: string;
  readonly topics: string[];
}

export class OnchainTransactionCreateRecord {
  readonly hash: string;
  readonly from: string;
  readonly chain: OnchainContractCreateTransactionRecordChain;
  readonly factory: string;
  readonly factoryVersion: string;
  readonly factoryAbi: string;
  readonly status: OnchainContractCreateTransactionRecordStatus;
  readonly value: number;
  readonly data: string;
  readonly logs: OnchainTransactionLog[];
}
