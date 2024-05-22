import { registerAs } from '@nestjs/config';

export default registerAs('monitoring', () => ({
  alchemyDelay: Number(process.env.ALCHEMY_MONITORING_DELAY),
  defenderDelay: Number(process.env.DEFENDER_MONITORING_DELAY),
  runMonitoringImmediately: process.env.RUN_MONITORING_IMMEDIATELY === 'true',
}));
