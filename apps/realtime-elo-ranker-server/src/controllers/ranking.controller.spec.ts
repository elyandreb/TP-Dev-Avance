import { Test, TestingModule } from '@nestjs/testing';
import { RankingController } from './ranking.controller';
import { RankingService } from '../services/ranking.service';
import { PlayerService } from '../services/player.service';
import { NotFoundException } from '@nestjs/common';
import { of } from 'rxjs';

describe('RankingController', () => {
  let controller: RankingController;
  let rankingService: RankingService;
  let playerService: PlayerService;

  const mockPlayerService = {
    getAllPlayers: jest.fn(),
  };

  const mockRankingService = {
    updateCache: jest.fn(),
    getRankingUpdates: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RankingController],
      providers: [
        {
          provide: PlayerService,
          useValue: mockPlayerService,
        },
        {
          provide: RankingService,
          useValue: mockRankingService,
        },
      ],
    }).compile();

    controller = module.get<RankingController>(RankingController);
    rankingService = module.get<RankingService>(RankingService);
    playerService = module.get<PlayerService>(PlayerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRanking', () => {
    it('should return the current ranking sorted by rank', async () => {
      const expectedRanking = [
        { id: 'player1', rank: 1250 },
        { id: 'player2', rank: 1200 },
        { id: 'player3', rank: 1150 },
      ];

      mockPlayerService.getAllPlayers.mockResolvedValue(expectedRanking);

      const result = await controller.getRanking();

      expect(result).toEqual(expectedRanking);
      expect(mockPlayerService.getAllPlayers).toHaveBeenCalledTimes(1);
      expect(mockRankingService.updateCache).toHaveBeenCalledWith(
        expectedRanking,
      );
    });

    it('should throw NotFoundException when no players exist', async () => {
      mockPlayerService.getAllPlayers.mockResolvedValue([]);

      await expect(controller.getRanking()).rejects.toThrow(NotFoundException);
      expect(mockPlayerService.getAllPlayers).toHaveBeenCalledTimes(1);
    });

    it('should handle single player ranking', async () => {
      const expectedRanking = [{ id: 'player1', rank: 1200 }];

      mockPlayerService.getAllPlayers.mockResolvedValue(expectedRanking);

      const result = await controller.getRanking();

      expect(result).toEqual(expectedRanking);
      expect(result.length).toBe(1);
    });

    it('should return ranking in descending order by rank', async () => {
      const expectedRanking = [
        { id: 'alice', rank: 1300 },
        { id: 'bob', rank: 1250 },
        { id: 'charlie', rank: 1100 },
      ];

      mockPlayerService.getAllPlayers.mockResolvedValue(expectedRanking);

      const result = await controller.getRanking();

      // Vérifier que l'ordre est correct
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].rank).toBeGreaterThanOrEqual(result[i + 1].rank);
      }
    });
  });

  describe('rankingEvents', () => {
    it('should return an Observable for SSE events', () => {
      const mockPlayer = { id: 'player1', rank: 1216 };

      const mockObservable = of(mockPlayer);

      mockRankingService.getRankingUpdates.mockReturnValue(mockObservable);

      const result = controller.rankingEvents();

      expect(result).toBeDefined();
      expect(mockRankingService.getRankingUpdates).toHaveBeenCalledTimes(1);
    });

    it('should return observable that can be subscribed to', (done) => {
      const mockPlayer = { id: 'player1', rank: 1200 };

      const mockObservable = of(mockPlayer);

      mockRankingService.getRankingUpdates.mockReturnValue(mockObservable);

      const result = controller.rankingEvents();

      result.subscribe({
        next: (event) => {
          expect(event.data.type).toBe('RankingUpdate');
          expect(event.data.player).toEqual(mockPlayer);
          done();
        },
      });
    });

    it('should call getRankingUpdates from service', () => {
      const mockObservable = of({ id: 'player1', rank: 1200 });
      mockRankingService.getRankingUpdates.mockReturnValue(mockObservable);

      controller.rankingEvents();

      expect(mockRankingService.getRankingUpdates).toHaveBeenCalled();
    });
  });
});
