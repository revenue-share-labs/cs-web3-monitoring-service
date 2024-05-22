import { Network } from 'alchemy-sdk';
import { registerAs } from '@nestjs/config';

export default registerAs('alchemy', () => ({
  apiKey: process.env.ALCHEMY_API_KEY,
  network: process.env.ALCHEMY_WEB3_NETWORK as Network,
}));
