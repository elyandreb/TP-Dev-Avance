import { Test, TestingModule } from '@nestjs/testing';
import { EloCalculatorService } from './elo-calculator.service';

describe('EloCalculatorService', () => {
  let service: EloCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EloCalculatorService],
    }).compile();

    service = module.get<EloCalculatorService>(EloCalculatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateExpectedScore', () => {
    it('should return 0.5 when both players have the same rating', () => {
      const result = service.calculateExpectedScore(1200, 1200);
      expect(result).toBeCloseTo(0.5, 2);
    });

    it('should return higher probability for higher rated player', () => {
      const result = service.calculateExpectedScore(1400, 1200);
      expect(result).toBeGreaterThan(0.5);
      expect(result).toBeCloseTo(0.76, 2);
    });

    it('should return lower probability for lower rated player', () => {
      const result = service.calculateExpectedScore(1200, 1400);
      expect(result).toBeLessThan(0.5);
      expect(result).toBeCloseTo(0.24, 2);
    });
  });

  describe('calculateNewRank', () => {
    it('should increase rank when winning unexpectedly', () => {
      // Joueur faible (1200) bat joueur fort (1400)
      // Espérance: 0.24, Score réel: 1
      const newRank = service.calculateNewRank(1200, 0.24, 1);
      expect(newRank).toBeGreaterThan(1200);
      expect(newRank).toBe(1224); // 1200 + 32 * (1 - 0.24) ≈ 1224
    });

    it('should decrease rank when losing as expected', () => {
      // Joueur faible (1200) perd contre joueur fort (1400)
      // Espérance: 0.24, Score réel: 0
      const newRank = service.calculateNewRank(1200, 0.24, 0);
      expect(newRank).toBeLessThan(1200);
      expect(newRank).toBe(1192); // 1200 + 32 * (0 - 0.24) ≈ 1192
    });

    it('should slightly change rank on draw', () => {
      const newRank = service.calculateNewRank(1200, 0.5, 0.5);
      expect(newRank).toBe(1200); // Pas de changement si espérance = résultat
    });

    it('should handle wins as expected with smaller gain', () => {
      // Joueur fort (1400) bat joueur faible (1200)
      // Espérance: 0.76, Score réel: 1
      const newRank = service.calculateNewRank(1400, 0.76, 1);
      expect(newRank).toBeGreaterThan(1400);
      expect(newRank).toBe(1408); // 1400 + 32 * (1 - 0.76) ≈ 1408
    });
  });

  describe('calculateInitialRank', () => {
    it('should return default rank (1200) when no players exist', () => {
      const rank = service.calculateInitialRank([]);
      expect(rank).toBe(1200);
    });

    it('should return average of existing ranks', () => {
      const rank = service.calculateInitialRank([1000, 1200, 1400]);
      expect(rank).toBe(1200); // (1000 + 1200 + 1400) / 3 = 1200
    });

    it('should round the average rank', () => {
      const rank = service.calculateInitialRank([1000, 1100]);
      expect(rank).toBe(1050); // (1000 + 1100) / 2 = 1050
    });

    it('should handle single player', () => {
      const rank = service.calculateInitialRank([1500]);
      expect(rank).toBe(1500);
    });
  });

  describe('getKFactor', () => {
    it('should return 32', () => {
      expect(service.getKFactor()).toBe(32);
    });
  });

  describe('getDefaultInitialRank', () => {
    it('should return 1200', () => {
      expect(service.getDefaultInitialRank()).toBe(1200);
    });
  });
});
