import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PlayerService } from './player.service';
import { EloCalculatorService } from './elo-calculator.service';
import { RankingService } from './ranking.service';
import { Player } from '../entities/player.entity';
import { MatchResult } from '../models/match-result.model';

/**
 * Service pour traiter les matchs et mettre à jour les classements.
 * Responsabilité : Logique métier des matchs et coordination entre services.
 */
@Injectable()
export class MatchService {
  /**
   * Historique de tous les matchs joués.
   * Stocké en mémoire (pourrait être persisté en BDD dans une version étendue).
   */
  private matches: MatchResult[] = [];

  constructor(
    private readonly playerService: PlayerService,
    private readonly eloCalculator: EloCalculatorService,
    private readonly rankingService: RankingService,
  ) {}

  /**
   * Traite un match terminé, met à jour les classements Elo et notifie les abonnés.
   * Formule de mise à jour : Rn = Ro + K * (W - We)
   *
   * @param {string} winnerId - L'ID du vainqueur (ou joueur 1 si match nul).
   * @param {string} loserId - L'ID du perdant (ou joueur 2 si match nul).
   * @param {boolean} isDraw - Indique si le match est nul (égalité).
   * @throws {UnprocessableEntityException} Si l'un des joueurs n'existe pas.
   * @returns {Promise<{ winner: Player; loser: Player }>} Les deux joueurs avec leurs nouveaux classements.
   */
  async processMatch(
    winnerId: string,
    loserId: string,
    isDraw: boolean = false,
  ): Promise<{ winner: Player; loser: Player }> {
    // Récupération des joueurs
    const winner = await this.playerService.findPlayerById(winnerId);
    const loser = await this.playerService.findPlayerById(loserId);

    if (!winner || !loser) {
      throw new UnprocessableEntityException(
        "L'un des joueurs spécifiés n'existe pas.",
      );
    }

    // Score réel (W) : 1 pour victoire, 0 pour défaite, 0.5 pour nul
    const scoreWinner = isDraw ? 0.5 : 1;
    const scoreLoser = isDraw ? 0.5 : 0;

    // Espérance de victoire (We)
    const expectedWinner = this.eloCalculator.calculateExpectedScore(
      winner.rank,
      loser.rank,
    );
    const expectedLoser = this.eloCalculator.calculateExpectedScore(
      loser.rank,
      winner.rank,
    );

    // Calcul des nouveaux rangs
    const newWinnerRank = this.eloCalculator.calculateNewRank(
      winner.rank,
      expectedWinner,
      scoreWinner,
    );
    const newLoserRank = this.eloCalculator.calculateNewRank(
      loser.rank,
      expectedLoser,
      scoreLoser,
    );

    // Mise à jour en base de données
    const updatedWinner = await this.playerService.updatePlayerRank(
      winnerId,
      newWinnerRank,
    );
    const updatedLoser = await this.playerService.updatePlayerRank(
      loserId,
      newLoserRank,
    );

    // Archivage du match
    this.matches.push({
      winnerId,
      loserId,
      isDraw,
      date: new Date(),
    });

    // Émission des événements pour le temps réel
    this.rankingService.emitRankingUpdate(updatedWinner);
    this.rankingService.emitRankingUpdate(updatedLoser);

    return { winner: updatedWinner, loser: updatedLoser };
  }

  /**
   * Récupère l'historique de tous les matchs.
   *
   * @returns {MatchResult[]} Liste de tous les matchs joués
   */
  getMatchHistory(): MatchResult[] {
    return [...this.matches];
  }

  /**
   * Compte le nombre total de matchs joués.
   *
   * @returns {number} Le nombre de matchs
   */
  getMatchCount(): number {
    return this.matches.length;
  }
}
