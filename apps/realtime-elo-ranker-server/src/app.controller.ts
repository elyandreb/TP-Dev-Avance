import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import * as appService_1 from './app.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * DTO pour la création d'un joueur.
 */
class CreatePlayerDto {
  /** Identifiant unique souhaité pour le joueur */
  id: string;
}

/**
 * DTO pour la déclaration d'un résultat de match.
 */
class CreateMatchDto {
  /** Identifiant du vainqueur */
  winner: string;
  /** Identifiant du perdant */
  loser: string;
  /** True si le match est une égalité */
  draw: boolean;
}

/**
 * Contrôleur principal exposant l'API REST et SSE.
 */
@Controller('api')
export class AppController {
  constructor(private readonly appService: appService_1.AppService) {}

  /**
   * Crée un nouveau joueur.
   * @param {CreatePlayerDto} body - Les données du joueur.
   * @returns {appService_1.Player} Le joueur créé avec son rang initial.
   */
  @Post('player')
  createPlayer(@Body() body: CreatePlayerDto): appService_1.Player {
    return this.appService.createPlayer(body.id);
  }

  /**
   * Récupère le classement actuel.
   * @throws {NotFoundException} (404) Si aucun joueur n'existe encore.
   * @returns {appService_1.Player[]} La liste des joueurs triée.
   */
  @Get('ranking')
  getRanking(): appService_1.Player[] {
    const players = this.appService.getAllPlayers();
    if (players.length === 0) {
      throw new NotFoundException(
        "Le classement n'est pas disponible car aucun joueur n'existe",
      );
    }
    return players;
  }

  /**
   * Enregistre un match et met à jour les classements.
   * @param {CreateMatchDto} body - Le résultat du match.
   * @returns Les nouvelles données des deux joueurs impliqués.
   */
  @Post('match')
  @HttpCode(200)
  createMatch(@Body() body: CreateMatchDto) {
    return this.appService.processMatch(body.winner, body.loser, body.draw);
  }

  /**
   * Flux SSE (Server-Sent Events) pour le classement en temps réel.
   * Le client reste connecté et reçoit une mise à jour à chaque modification de rang.
   * * @returns {Observable<MessageEvent>} Un flux d'événements conforme au format attendu par le client.
   */
  @Sse('ranking/events')
  rankingEvents(): Observable<MessageEvent> {
    return this.appService.getRankingUpdates().pipe(
      map((player) => ({
        data: {
          type: 'RankingUpdate',
          player: player,
        },
      })),
    );
  }
}
