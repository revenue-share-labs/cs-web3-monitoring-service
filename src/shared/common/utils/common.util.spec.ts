import { sleep } from './common.util';

describe('CommonUtil', () => {
  describe('sleep', () => {
    it('should resolve after given time', async () => {
      const startTime = new Date().getTime();
      const ms = 100;
      await sleep(ms);
      const endTime = new Date().getTime();
      expect(endTime - startTime).toBeGreaterThanOrEqual(ms);
    });

    it('should resolve immediately for 0ms', async () => {
      const startTime = new Date().getTime();
      const ms = 0;
      await sleep(ms);
      const endTime = new Date().getTime();
      expect(endTime - startTime).toBeLessThan(10);
    });
  });
});
