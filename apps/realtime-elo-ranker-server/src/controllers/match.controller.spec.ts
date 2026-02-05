import { Test, TestingModule } from '@nestjs/testing';
import { MatchController } from './match.controller';
import { MatchService } from '../services/match.service';
import { CreateMatchDto } from '../dto/create-match.dto';
import { NotFoundException } from '@nestjs/common';

describe('MatchController', () => {
  let controller: MatchController;
  let matchService: MatchService;

  const mockMatchService = {
    processMatch: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchController],
      providers: [
        {
          provide: MatchService,
          useValue: mockMatchService,
        },
      ],
    }).compile();

    controller = module.get<MatchController>(MatchController);
    matchService = module.get<MatchService>(MatchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createMatch', () => {
    it('should process a match with winner and loser', async () => {
      const createMatchDto: CreateMatchDto = {
        winner: 'player1',
        loser: 'player2',
        draw: false,
      };

      const expectedResult = {
        winner: { id: 'player1', rank: 1216 },
        loser: { id: 'player2', rank: 1184 },
      };

      mockMatchService.processMatch.mockResolvedValue(expectedResult);

      const result = await controller.createMatch(createMatchDto);

      expect(result).toEqual(expectedResult);
      expect(matchService.processMatch).toHaveBeenCalledWith(
        'player1',
        'player2',
        false,
      );
      expect(matchService.processMatch).toHaveBeenCalledTimes(1);
    });

    it('should process a draw match', async () => {
      const createMatchDto: CreateMatchDto = {
        winner: 'player1',
        loser: 'player2',
        draw: true,
      };

      const expectedResult = {
        winner: { id: 'player1', rank: 1200 },
        loser: { id: 'player2', rank: 1200 },
      };

      mockMatchService.processMatch.mockResolvedValue(expectedResult);

      const result = await controller.createMatch(createMatchDto);

      expect(result).toEqual(expectedResult);
      expect(matchService.processMatch).toHaveBeenCalledWith(
        'player1',
        'player2',
        true,
      );
    });

    it('should throw NotFoundException if winner does not exist', async () => {
      const createMatchDto: CreateMatchDto = {
        winner: 'unknownPlayer',
        loser: 'player2',
        draw: false,
      };

      mockMatchService.processMatch.mockRejectedValue(
        new NotFoundException('Player unknownPlayer not found'),
      );

      await expect(controller.createMatch(createMatchDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if loser does not exist', async () => {
      const createMatchDto: CreateMatchDto = {
        winner: 'player1',
        loser: 'unknownPlayer',
        draw: false,
      };

      mockMatchService.processMatch.mockRejectedValue(
        new NotFoundException('Player unknownPlayer not found'),
      );

      await expect(controller.createMatch(createMatchDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle match with default draw value', async () => {
      const createMatchDto: CreateMatchDto = {
        winner: 'player1',
        loser: 'player2',
      };

      const expectedResult = {
        winner: { id: 'player1', rank: 1216 },
        loser: { id: 'player2', rank: 1184 },
      };

      mockMatchService.processMatch.mockResolvedValue(expectedResult);

      const result = await controller.createMatch(createMatchDto);

      expect(result).toEqual(expectedResult);
      expect(matchService.processMatch).toHaveBeenCalledWith(
        'player1',
        'player2',
        false,
      );
    });
  });
});

