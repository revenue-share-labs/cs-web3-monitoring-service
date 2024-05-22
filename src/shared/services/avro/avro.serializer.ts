import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import { SchemaType } from '@kafkajs/confluent-schema-registry/dist/@types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ApacheAvroSerializer<T> {
  private registryId: number;

  constructor(readonly registry: SchemaRegistry) {}

  protected async init(schema: string): Promise<void> {
    const { id } = await this.registry.register({
      type: SchemaType.AVRO,
      schema,
    });
    this.registryId = id;
  }

  async serialize(payload: T): Promise<Buffer> {
    if (!this.registryId) {
      throw new Error('registryId is not defined');
    }
    return this.registry.encode(this.registryId, payload);
  }
}
