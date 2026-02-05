import { Test, TestingModule } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { MatchService } from './match.service';
import { PlayerService } from './player.service';
import { EloCalculatorService } from './elo-calculator.service';
import { RankingService } from './ranking.service';
import { Player } from '../entities/player.entity';

describe('MatchService', () => {
  let service: MatchService;
  let playerService: PlayerService;
  let eloCalculator: EloCalculatorService;
  let rankingService: RankingService;

  const mockPlayerService = {
    findPlayerById: jest.fn(),
    updatePlayerRank: jest.fn(),
  };

  const mockEloCalculator = {
    calculateExpectedScore: jest.fn(),
    calculateNewRank: jest.fn(),
  };

  const mockRankingService = {
    emitRankingUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchService,
        {
          provide: PlayerService,
          useValue: mockPlayerService,
        },
        {
          provide: EloCalculatorService,
          useValue: mockEloCalculator,
        },
        {
          provide: RankingService,
          useValue: mockRankingService,
        },
      ],
    }).compile();

    service = module.get<MatchService>(MatchService);
    playerService = module.get<PlayerService>(PlayerService);
    eloCalculator = module.get<EloCalculatorService>(EloCalculatorService);
    rankingService = module.get<RankingService>(RankingService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processMatch', () => {
    const winner: Player = { id: 'winner', rank: 1200 };
    const loser: Player = { id: 'loser', rank: 1200 };

    beforeEach(() => {
      mockPlayerService.findPlayerById.mockImplementation((id: string) => {
        if (id === 'winner') return Promise.resolve(winner);
        if (id === 'loser') return Promise.resolve(loser);
        return Promise.resolve(null);
      });
    });

    it('should throw UnprocessableEntityException if winner does not exist', async () => {
      mockPlayerService.findPlayerById.mockResolvedValue(null);

      await expect(
        service.processMatch('nonexistent', 'loser', false),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw UnprocessableEntityException if loser does not exist', async () => {
      mockPlayerService.findPlayerById.mockImplementation((id: string) => {
        if (id === 'winner') return Promise.resolve(winner);
        return Promise.resolve(null);
      });

      await expect(
        service.processMatch('winner', 'nonexistent', false),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should process a match with a winner and update ranks', async () => {
      const updatedWinner: Player = { id: 'winner', rank: 1208 };
      const updatedLoser: Player = { id: 'loser', rank: 1192 };

      mockEloCalculator.calculateExpectedScore.mockReturnValueOnce(0.5); // Winner expected
      mockEloCalculator.calculateExpectedScore.mockReturnValueOnce(0.5); // Loser expected
      mockEloCalculator.calculateNewRank.mockReturnValueOnce(1208); // Winner new rank
      mockEloCalculator.calculateNewRank.mockReturnValueOnce(1192); // Loser new rank
      mockPlayerService.updatePlayerRank.mockResolvedValueOnce(updatedWinner);
      mockPlayerService.updatePlayerRank.mockResolvedValueOnce(updatedLoser);

      const result = await service.processMatch('winner', 'loser', false);

      expect(result.winner).toEqual(updatedWinner);
      expect(result.loser).toEqual(updatedLoser);
      expect(mockEloCalculator.calculateExpectedScore).toHaveBeenCalledTimes(2);
      expect(mockEloCalculator.calculateNewRank).toHaveBeenCalledWith(1200, 0.5, 1); // Winner: score = 1
      expect(mockEloCalculator.calculateNewRank).toHaveBeenCalledWith(1200, 0.5, 0); // Loser: score = 0
      expect(mockPlayerService.updatePlayerRank).toHaveBeenCalledTimes(2);
      expect(mockRankingService.emitRankingUpdate).toHaveBeenCalledTimes(2);
    });

    it('should process a draw and update ranks with 0.5 score', async () => {
      const updatedWinner: Player = { id: 'winner', rank: 1200 };
      const updatedLoser: Player = { id: 'loser', rank: 1200 };

      mockEloCalculator.calculateExpectedScore.mockReturnValueOnce(0.5);
      mockEloCalculator.calculateExpectedScore.mockReturnValueOnce(0.5);
      mockEloCalculator.calculateNewRank.mockReturnValueOnce(1200);
      mockEloCalculator.calculateNewRank.mockReturnValueOnce(1200);
      mockPlayerService.updatePlayerRank.mockResolvedValueOnce(updatedWinner);
      mockPlayerService.updatePlayerRank.mockResolvedValueOnce(updatedLoser);

      const result = await service.processMatch('winner', 'loser', true);

      expect(result.winner).toEqual(updatedWinner);
      expect(result.loser).toEqual(updatedLoser);
      expect(mockEloCalculator.calculateNewRank).toHaveBeenCalledWith(1200, 0.5, 0.5); // Both: score = 0.5
      expect(mockRankingService.emitRankingUpdate).toHaveBeenCalledTimes(2);
    });

    it('should archive the match in history', async () => {
      const updatedWinner: Player = { id: 'winner', rank: 1208 };
      const updatedLoser: Player = { id: 'loser', rank: 1192 };

      mockEloCalculator.calculateExpectedScore.mockReturnValue(0.5);
      mockEloCalculator.calculateNewRank.mockReturnValueOnce(1208);
      mockEloCalculator.calculateNewRank.mockReturnValueOnce(1192);
      mockPlayerService.updatePlayerRank.mockResolvedValueOnce(updatedWinner);
      mockPlayerService.updatePlayerRank.mockResolvedValueOnce(updatedLoser);

      await service.processMatch('winner', 'loser', false);

      const history = service.getMatchHistory();
      expect(history.length).toBe(1);
      expect(history[0]).toMatchObject({
        winnerId: 'winner',
        loserId: 'loser',
        isDraw: false,
      });
      expect(history[0].date).toBeInstanceOf(Date);
    });
  });

  describe('getMatchHistory', () => {
    it('should return empty array initially', () => {
      const history = service.getMatchHistory();
      expect(history).toEqual([]);
    });

    it('should return a copy of match history', async () => {
      const winner: Player = { id: 'winner', rank: 1200 };
      const loser: Player = { id: 'loser', rank: 1200 };

      mockPlayerService.findPlayerById.mockImplementation((id: string) => {
        if (id === 'winner') return Promise.resolve(winner);
        if (id === 'loser') return Promise.resolve(loser);
        return Promise.resolve(null);
      });
      mockEloCalculator.calculateExpectedScore.mockReturnValue(0.5);
      mockEloCalculator.calculateNewRank.mockReturnValue(1200);
      mockPlayerService.updatePlayerRank.mockResolvedValue(winner);

      await service.processMatch('winner', 'loser', false);

      const history1 = service.getMatchHistory();
      const history2 = service.getMatchHistory();

      expect(history1).toEqual(history2);
      expect(history1).not.toBe(history2); // Doit être une copie
    });
  });

  describe('getMatchCount', () => {
    it('should return 0 initially', () => {
      expect(service.getMatchCount()).toBe(0);
    });

    it('should return correct count after matches', async () => {
      const winner: Player = { id: 'winner', rank: 1200 };
      const loser: Player = { id: 'loser', rank: 1200 };

      mockPlayerService.findPlayerById.mockImplementation((id: string) => {
        if (id === 'winner') return Promise.resolve(winner);
        if (id === 'loser') return Promise.resolve(loser);
        return Promise.resolve(null);
      });
      mockEloCalculator.calculateExpectedScore.mockReturnValue(0.5);
      mockEloCalculator.calculateNewRank.mockReturnValue(1200);
      mockPlayerService.updatePlayerRank.mockResolvedValue(winner);

      await service.processMatch('winner', 'loser', false);
      await service.processMatch('winner', 'loser', false);

      expect(service.getMatchCount()).toBe(2);
    });
  });
});
