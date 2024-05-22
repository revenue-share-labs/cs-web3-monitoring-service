/* eslint-disable @typescript-eslint/no-explicit-any */

import { SchemaRegistry, SchemaType } from '@kafkajs/confluent-schema-registry';
import { ApacheAvroSerializer } from './avro.serializer';
import { mockDeep } from 'jest-mock-extended';

describe('ApacheAvroSerializer', () => {
  const mockHost = 'http://localhost:8081';
  const mockSchema = `{
        "type": "record",
        "name": "OnchainTransactionCreateRecord",
        "namespace": "x.la.contracts",
        "version": "1",
        "fields": [
          { "name": "from", "type": "string" },
          {
            "name": "chain",
            "type": {
              "type": "enum",
              "name": "Chain",
              "symbols": ["ETHEREUM", "ETHEREUM_GOERLI", "POLYGON", "POLYGON_MUMBAI"]
            }
          },
          { "name": "factory", "type": "string" },
          { "name": "factoryVersion", "type": "string" },
          { "name": "factoryAbi", "type": "string" },
          {
            "name": "status",
            "type": {
              "type": "enum",
              "name": "TransactionStatus",
              "symbols": ["PENDING", "MINED", "FAILED", "CANCELED"]
            }
          },
          { "name": "data", "type": "string" },
          { "name": "value", "type": "long" }
        ]
      }`;

  it('should be defined correctly', () => {
    const apacheAvroSerializer = new ApacheAvroSerializer(
      new SchemaRegistry({ host: mockHost }),
    );
    const expectedRegistry = new SchemaRegistry({ host: mockHost });

    expect(apacheAvroSerializer['registry']['api']['_manifest'].host).toEqual(
      expectedRegistry['api']['_manifest'].host,
    );
  });

  describe('init', () => {
    it('should correctly init', async () => {
      const mockSchemaRegistry = mockDeep<SchemaRegistry>();
      mockSchemaRegistry.register.mockResolvedValue({ id: 1 });
      const apacheAvroSerializer = new ApacheAvroSerializer(mockSchemaRegistry);
      const spyRegister = jest.spyOn(mockSchemaRegistry as any, 'register');

      await apacheAvroSerializer['init'](mockSchema);

      expect(spyRegister.mock.calls[0][0]).toStrictEqual({
        type: SchemaType.AVRO,
        schema: mockSchema,
      });
    });
  });

  describe('serialize', () => {
    it('should correctly serialize', async () => {
      const mockSchemaRegistry = mockDeep<SchemaRegistry>();
      const apacheAvroSerializer = new ApacheAvroSerializer(mockSchemaRegistry);
      apacheAvroSerializer['registryId'] = 1;
      const spyRegister = jest.spyOn(mockSchemaRegistry as any, 'encode');

      apacheAvroSerializer.serialize({});

      expect(spyRegister.mock.calls[0][0]).toStrictEqual(1);
    });
  });
});
