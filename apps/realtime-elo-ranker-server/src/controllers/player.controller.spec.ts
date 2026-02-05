import { Test, TestingModule } from '@nestjs/testing';
import { PlayerController } from './player.controller';
import { PlayerService } from '../services/player.service';
import { CreatePlayerDto } from '../dto/create-player.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('PlayerController', () => {
  let controller: PlayerController;
  let playerService: PlayerService;

  const mockPlayerService = {
    createPlayer: jest.fn(),
    findPlayerById: jest.fn(),
    getAllPlayers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayerController],
      providers: [
        {
          provide: PlayerService,
          useValue: mockPlayerService,
        },
      ],
    }).compile();

    controller = module.get<PlayerController>(PlayerController);
    playerService = module.get<PlayerService>(PlayerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPlayer', () => {
    it('should create a new player successfully', async () => {
      const createPlayerDto: CreatePlayerDto = { id: 'player1' };
      const expectedPlayer = { id: 'player1', rank: 1200 };

      mockPlayerService.createPlayer.mockResolvedValue(expectedPlayer);

      const result = await controller.createPlayer(createPlayerDto);

      expect(result).toEqual(expectedPlayer);
      expect(playerService.createPlayer).toHaveBeenCalledWith('player1');
      expect(playerService.createPlayer).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if player already exists', async () => {
      const createPlayerDto: CreatePlayerDto = { id: 'existingPlayer' };

      mockPlayerService.createPlayer.mockRejectedValue(
        new ConflictException('Player with this ID already exists'),
      );

      await expect(controller.createPlayer(createPlayerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(playerService.createPlayer).toHaveBeenCalledWith('existingPlayer');
    });

    it('should handle different player IDs', async () => {
      const playerIds = ['alice', 'bob', 'charlie'];

      for (const id of playerIds) {
        const dto: CreatePlayerDto = { id };
        const expectedPlayer = { id, rank: 1200 };
        mockPlayerService.createPlayer.mockResolvedValue(expectedPlayer);

        const result = await controller.createPlayer(dto);

        expect(result.id).toBe(id);
      }
    });
  });
});
