import { Test, TestingModule } from '@nestjs/testing';
import { RankingService } from './ranking.service';
import { Player } from '../entities/player.entity';

describe('RankingService', () => {
  let service: RankingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RankingService],
    }).compile();

    service = module.get<RankingService>(RankingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRankingUpdates', () => {
    it('should return an observable', () => {
      const observable = service.getRankingUpdates();
      expect(observable).toBeDefined();
      expect(observable.subscribe).toBeDefined();
    });

    it('should emit player updates', (done) => {
      const testPlayer: Player = { id: 'player1', rank: 1200 };
      const observable = service.getRankingUpdates();

      observable.subscribe((player) => {
        expect(player).toEqual(testPlayer);
        done();
      });

      service.emitRankingUpdate(testPlayer);
    });
  });

  describe('emitRankingUpdate', () => {
    it('should emit a player update event', (done) => {
      const player1: Player = { id: 'player1', rank: 1200 };
      const player2: Player = { id: 'player2', rank: 1250 };

      const updates: Player[] = [];
      service.getRankingUpdates().subscribe((player) => {
        updates.push(player);
        if (updates.length === 2) {
          expect(updates).toEqual([player1, player2]);
          done();
        }
      });

      service.emitRankingUpdate(player1);
      service.emitRankingUpdate(player2);
    });
  });

  describe('updateCache', () => {
    it('should store players in cache', () => {
      const players: Player[] = [
        { id: 'player1', rank: 1400 },
        { id: 'player2', rank: 1200 },
      ];

      service.updateCache(players);
      const cached = service.getCachedRanking();

      expect(cached).toEqual(players);
    });

    it('should create a copy of the array', () => {
      const players: Player[] = [{ id: 'player1', rank: 1200 }];

      service.updateCache(players);
      players.push({ id: 'player2', rank: 1300 });

      const cached = service.getCachedRanking();
      expect(cached.length).toBe(1); // Le cache ne doit pas être affecté
    });
  });

  describe('getCachedRanking', () => {
    it('should return empty array initially', () => {
      const cached = service.getCachedRanking();
      expect(cached).toEqual([]);
    });

    it('should return cached players', () => {
      const players: Player[] = [
        { id: 'player1', rank: 1400 },
        { id: 'player2', rank: 1200 },
      ];

      service.updateCache(players);
      const cached = service.getCachedRanking();

      expect(cached).toEqual(players);
    });

    it('should return a copy of cached array', () => {
      const players: Player[] = [{ id: 'player1', rank: 1200 }];

      service.updateCache(players);
      const cached = service.getCachedRanking();
      cached.push({ id: 'player2', rank: 1300 });

      const cached2 = service.getCachedRanking();
      expect(cached2.length).toBe(1); // Le cache original ne doit pas être modifié
    });
  });

  describe('clearCache', () => {
    it('should clear the cache', () => {
      const players: Player[] = [{ id: 'player1', rank: 1200 }];

      service.updateCache(players);
      expect(service.getCachedRanking().length).toBe(1);

      service.clearCache();
      expect(service.getCachedRanking().length).toBe(0);
    });
  });
});
