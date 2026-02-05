import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { PlayerService } from './player.service';
import { EloCalculatorService } from './elo-calculator.service';
import { Player } from '../entities/player.entity';

describe('PlayerService', () => {
  let service: PlayerService;
  let repository: Repository<Player>;
  let eloCalculator: EloCalculatorService;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };

  const mockEloCalculator = {
    calculateInitialRank: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerService,
        {
          provide: getRepositoryToken(Player),
          useValue: mockRepository,
        },
        {
          provide: EloCalculatorService,
          useValue: mockEloCalculator,
        },
      ],
    }).compile();

    service = module.get<PlayerService>(PlayerService);
    repository = module.get<Repository<Player>>(getRepositoryToken(Player));
    eloCalculator = module.get<EloCalculatorService>(EloCalculatorService);

    // Reset des mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPlayer', () => {
    it('should create a new player with calculated initial rank', async () => {
      const playerId = 'player1';
      const initialRank = 1200;

      mockRepository.findOne.mockResolvedValue(null); // Le joueur n'existe pas
      mockRepository.find.mockResolvedValue([
        { id: 'existing1', rank: 1100 },
        { id: 'existing2', rank: 1300 },
      ]);
      mockEloCalculator.calculateInitialRank.mockReturnValue(initialRank);
      mockRepository.create.mockReturnValue({ id: playerId, rank: initialRank });
      mockRepository.save.mockResolvedValue({ id: playerId, rank: initialRank });

      const result = await service.createPlayer(playerId);

      expect(result).toEqual({ id: playerId, rank: initialRank });
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: playerId } });
      expect(mockRepository.find).toHaveBeenCalled();
      expect(mockEloCalculator.calculateInitialRank).toHaveBeenCalledWith([1100, 1300]);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if player already exists', async () => {
      const playerId = 'existing';
      mockRepository.findOne.mockResolvedValue({ id: playerId, rank: 1200 });

      await expect(service.createPlayer(playerId)).rejects.toThrow(ConflictException);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findPlayerById', () => {
    it('should return a player if found', async () => {
      const player = { id: 'player1', rank: 1200 };
      mockRepository.findOne.mockResolvedValue(player);

      const result = await service.findPlayerById('player1');

      expect(result).toEqual(player);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'player1' } });
    });

    it('should return null if player not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findPlayerById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getAllPlayers', () => {
    it('should return all players sorted by rank descending', async () => {
      const players = [
        { id: 'player1', rank: 1400 },
        { id: 'player2', rank: 1200 },
        { id: 'player3', rank: 1300 },
      ];
      mockRepository.find.mockResolvedValue(players);

      const result = await service.getAllPlayers();

      expect(result).toEqual(players);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { rank: 'DESC' },
      });
    });

    it('should return empty array when no players exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getAllPlayers();

      expect(result).toEqual([]);
    });
  });

  describe('updatePlayerRank', () => {
    it('should update player rank and return updated player', async () => {
      const playerId = 'player1';
      const newRank = 1250;
      const updatedPlayer = { id: playerId, rank: newRank };

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(updatedPlayer);

      const result = await service.updatePlayerRank(playerId, newRank);

      expect(result).toEqual(updatedPlayer);
      expect(mockRepository.update).toHaveBeenCalledWith({ id: playerId }, { rank: newRank });
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: playerId } });
    });
  });

  describe('count', () => {
    it('should return the number of players', async () => {
      mockRepository.count.mockResolvedValue(5);

      const result = await service.count();

      expect(result).toBe(5);
      expect(mockRepository.count).toHaveBeenCalled();
    });
  });
});
