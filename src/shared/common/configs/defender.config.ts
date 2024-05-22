import { registerAs } from '@nestjs/config';

export default registerAs('defender', () => ({
  apiKey: process.env.DEFENDER_API_KEY,
  apiSecret: process.env.DEFENDER_API_SECRET,
  chainId: Number(process.env.DEFENDER_CHAIN_ID),
}));
