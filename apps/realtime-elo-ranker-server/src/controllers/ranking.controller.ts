import { Controller, Get, Sse, NotFoundException, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PlayerService } from '../services/player.service';
import { RankingService } from '../services/ranking.service';
import { Player } from '../entities/player.entity';

/**
 * Contrôleur pour la gestion du classement.
 * Responsabilité : Gérer les entrées/sorties HTTP pour le classement.
 */
@Controller('api/ranking')
export class RankingController {
  constructor(
    private readonly playerService: PlayerService,
    private readonly rankingService: RankingService,
  ) {}

  /**
   * Récupère le classement actuel.
   *
   * @throws {NotFoundException} (404) Si aucun joueur n'existe encore.
   * @returns {Promise<Player[]>} La liste des joueurs triée par classement décroissant.
   */
  @Get()
  async getRanking(): Promise<Player[]> {
    const players = await this.playerService.getAllPlayers();
    if (players.length === 0) {
      throw new NotFoundException(
        "Le classement n'est pas disponible car aucun joueur n'existe",
      );
    }
    // Met à jour le cache
    this.rankingService.updateCache(players);
    return players;
  }

  /**
   * Flux SSE (Server-Sent Events) pour le classement en temps réel.
   * Le client reste connecté et reçoit une mise à jour à chaque modification de rang.
   *
   * @returns {Observable<MessageEvent>} Un flux d'événements conforme au format attendu par le client.
   */
  @Sse('events')
  rankingEvents(): Observable<MessageEvent> {
    return this.rankingService.getRankingUpdates().pipe(
      map((player) => ({
        data: {
          type: 'RankingUpdate',
          player: player,
        },
      })),
    );
  }
}
