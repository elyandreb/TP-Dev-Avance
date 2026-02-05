import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Player } from '../src/entities/player.entity';

describe('Realtime ELO Ranker API (e2e)', () => {
  let app: INestApplication<App>;
  let playerRepository: any;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Active la validation des DTOs
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Récupère le repository pour nettoyer la BDD entre les tests
    playerRepository = moduleFixture.get(getRepositoryToken(Player));
  });

  afterEach(async () => {
    // Nettoyage de la base de données après chaque test
    await playerRepository.clear();
    await app.close();
  });

  describe('/api/player (POST)', () => {
    it('should create a new player with default rank (1200)', () => {
      return request(app.getHttpServer())
        .post('/api/player')
        .send({ id: 'player1' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'player1');
          expect(res.body).toHaveProperty('rank', 1200);
        });
    });

    it('should create a player with average rank when others exist', async () => {
      // Créer deux joueurs
      await request(app.getHttpServer())
        .post('/api/player')
        .send({ id: 'player1' })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/player')
        .send({ id: 'player2' })
        .expect(200);

      // Le troisième joueur devrait avoir le rang moyen
      return request(app.getHttpServer())
        .post('/api/player')
        .send({ id: 'player3' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'player3');
          expect(res.body).toHaveProperty('rank', 1200); // Moyenne de 1200 + 1200
        });
    });

    it('should return 409 if player already exists', async () => {
      await request(app.getHttpServer())
        .post('/api/player')
        .send({ id: 'player1' })
        .expect(200);

      return request(app.getHttpServer())
        .post('/api/player')
        .send({ id: 'player1' })
        .expect(409);
    });

    it('should return 400 if id is missing', () => {
      return request(app.getHttpServer())
        .post('/api/player')
        .send({})
        .expect(400);
    });

    it('should return 400 if id is empty string', () => {
      return request(app.getHttpServer())
        .post('/api/player')
        .send({ id: '' })
        .expect(400);
    });
  });

  describe('/api/ranking (GET)', () => {
    it('should return 404 when no players exist', () => {
      return request(app.getHttpServer())
        .get('/api/ranking')
        .expect(404);
    });

    it('should return all players sorted by rank descending', async () => {
      // Créer des joueurs
      await request(app.getHttpServer())
        .post('/api/player')
        .send({ id: 'player1' });

      await request(app.getHttpServer())
        .post('/api/player')
        .send({ id: 'player2' });

      // Simuler un match pour changer les rangs
      await request(app.getHttpServer())
        .post('/api/match')
        .send({ winner: 'player1', loser: 'player2', draw: false });

      return request(app.getHttpServer())
        .get('/api/ranking')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Array);
          expect(res.body.length).toBe(2);
          // Vérifie que le classement est décroissant
          expect(res.body[0].rank).toBeGreaterThanOrEqual(res.body[1].rank);
        });
    });
  });

  describe('/api/match (POST)', () => {
    beforeEach(async () => {
      // Créer deux joueurs pour les tests de matchs
      await request(app.getHttpServer())
        .post('/api/player')
        .send({ id: 'alice' });

      await request(app.getHttpServer())
        .post('/api/player')
        .send({ id: 'bob' });
    });

    it('should process a match and update player ranks', () => {
      return request(app.getHttpServer())
        .post('/api/match')
        .send({ winner: 'alice', loser: 'bob', draw: false })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('winner');
          expect(res.body).toHaveProperty('loser');
          expect(res.body.winner.id).toBe('alice');
          expect(res.body.loser.id).toBe('bob');
          expect(res.body.winner.rank).toBeGreaterThan(res.body.loser.rank);
        });
    });

    it('should process a draw match', () => {
      return request(app.getHttpServer())
        .post('/api/match')
        .send({ winner: 'alice', loser: 'bob', draw: true })
        .expect(200)
        .expect((res) => {
          expect(res.body.winner.rank).toBe(res.body.loser.rank); // Rangs identiques après match nul
        });
    });

    it('should return 422 if winner does not exist', () => {
      return request(app.getHttpServer())
        .post('/api/match')
        .send({ winner: 'nonexistent', loser: 'bob', draw: false })
        .expect(422);
    });

    it('should return 422 if loser does not exist', () => {
      return request(app.getHttpServer())
        .post('/api/match')
        .send({ winner: 'alice', loser: 'nonexistent', draw: false })
        .expect(422);
    });

    it('should return 400 if winner is missing', () => {
      return request(app.getHttpServer())
        .post('/api/match')
        .send({ loser: 'bob', draw: false })
        .expect(400);
    });

    it('should return 400 if loser is missing', () => {
      return request(app.getHttpServer())
        .post('/api/match')
        .send({ winner: 'alice', draw: false })
        .expect(400);
    });
  });

  describe('/api/ranking/events (SSE)', () => {
    it('should return SSE stream with correct headers', async () => {
      // Créer des joueurs d'abord
      await request(app.getHttpServer())
        .post('/api/player')
        .send({ id: 'player1' });

      await request(app.getHttpServer())
        .post('/api/player')
        .send({ id: 'player2' });

      return request(app.getHttpServer())
        .get('/api/ranking/events')
        .expect(200)
        .expect('Content-Type', /text\/event-stream/)
        .timeout(1000); // Limite le temps d'attente
    });
  });

  describe('Integration: Complete flow', () => {
    it('should handle complete workflow: create players, play matches, check ranking', async () => {
      // 1. Créer des joueurs
      await request(app.getHttpServer())
        .post('/api/player')
        .send({ id: 'alice' })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/player')
        .send({ id: 'bob' })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/player')
        .send({ id: 'charlie' })
        .expect(200);

      // 2. Jouer des matchs
      await request(app.getHttpServer())
        .post('/api/match')
        .send({ winner: 'alice', loser: 'bob', draw: false })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/match')
        .send({ winner: 'alice', loser: 'charlie', draw: false })
        .expect(200);

      // 3. Vérifier le classement
      const response = await request(app.getHttpServer())
        .get('/api/ranking')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(3);
      
      // Alice devrait être première
      expect(response.body[0].id).toBe('alice');
      expect(response.body[0].rank).toBeGreaterThan(1200);
    });
  });
});

