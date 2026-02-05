import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getApiInfo', () => {
    it('should return API information with name, version and endpoints', () => {
      const result = controller.getApiInfo();

      expect(result).toHaveProperty('name', 'Realtime ELO Ranker API');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('endpoints');
      expect(result.endpoints).toHaveProperty('player');
      expect(result.endpoints).toHaveProperty('match');
      expect(result.endpoints).toHaveProperty('ranking');
    });

    it('should include POST /api/player endpoint', () => {
      const result = controller.getApiInfo();

      expect(result.endpoints.player).toHaveProperty('POST /api/player');
    });

    it('should include POST /api/match endpoint', () => {
      const result = controller.getApiInfo();

      expect(result.endpoints.match).toHaveProperty('POST /api/match');
    });

    it('should include GET /api/ranking endpoint', () => {
      const result = controller.getApiInfo();

      expect(result.endpoints.ranking).toHaveProperty('GET /api/ranking');
    });

    it('should include GET /api/ranking/events endpoint for SSE', () => {
      const result = controller.getApiInfo();

      expect(result.endpoints.ranking).toHaveProperty('GET /api/ranking/events');
    });

    it('should include documentation field', () => {
      const result = controller.getApiInfo();

      expect(result).toHaveProperty('documentation');
      expect(typeof result.documentation).toBe('string');
    });
  });
});
