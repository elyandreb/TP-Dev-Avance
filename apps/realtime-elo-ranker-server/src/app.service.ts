import {
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Subject } from 'rxjs';

/**
 * Représente un joueur avec son identifiant et son classement Elo actuel.
 */
export interface Player {
  id: string;
  rank: number;
}

/**
 * Représente le résultat archivé d'un match.
 */
export interface MatchResult {
  winnerId: string;
  loserId: string;
  isDraw: boolean;
  date: Date;
}

/**
 * Service principal gérant la logique métier du classement Elo.
 * Stocke les données en mémoire et gère les mises à jour en temps réel.
 */
@Injectable()
export class AppService {
  private players: Player[] = [];
  private matches: MatchResult[] = [];

  /** * Subject RxJS permettant d'émettre des événements de mise à jour de classement.
   * Agit comme un bus d'événements interne.
   */
  private rankingEvents$ = new Subject<Player>();

  /** Classement par défaut attribué au tout premier joueur */
  private readonly DEFAULT_INITIAL_RANK = 1200;

  /** * Facteur K (Coefficient de développement).
   * Détermine la vitesse à laquelle le classement change.
   * K=32 est une valeur standard pour les débutants/systèmes simples.
   */
  private readonly K_FACTOR = 32;

  /**
   * Retourne un Observable émettant les joueurs dont le classement vient de changer.
   * Utilisé par le contrôleur pour le flux SSE (Server-Sent Events).
   * @returns {Observable<Player>} Un flux d'objets Player mis à jour.
   */
  getRankingUpdates() {
    return this.rankingEvents$.asObservable();
  }

  /**
   * Récupère la liste complète des joueurs.
   * @returns {Player[]} La liste des joueurs triée par classement décroissant.
   */
  getAllPlayers(): Player[] {
    return [...this.players].sort((a, b) => b.rank - a.rank);
  }

  /**
   * Recherche un joueur par son identifiant.
   * @param {string} id - L'identifiant du joueur à trouver.
   * @returns {Player | undefined} Le joueur trouvé ou undefined.
   */
  getPlayer(id: string): Player | undefined {
    return this.players.find((p) => p.id === id);
  }

  /**
   * Crée un nouveau joueur.
   * Le classement initial est calculé sur la moyenne des joueurs existants.
   * * @param {string} id - L'identifiant du nouveau joueur.
   * @throws {ConflictException} Si un joueur avec cet ID existe déjà.
   * @returns {Player} Le joueur nouvellement créé.
   */
  createPlayer(id: string): Player {
    if (this.getPlayer(id)) {
      throw new ConflictException(`Le joueur avec l'ID "${id}" existe déjà.`);
    }

    const initialRank = this.calculateInitialRank();
    const newPlayer: Player = { id, rank: initialRank };
    this.players.push(newPlayer);

    return newPlayer;
  }

  /**
   * Traite un match terminé, met à jour les classements Elo et notifie les abonnés.
   * * Formule de mise à jour : Rn = Ro + K * (W - We)
   * * @param {string} winnerId - L'ID du vainqueur (ou joueur 1 si match nul).
   * @param {string} loserId - L'ID du perdant (ou joueur 2 si match nul).
   * @param {boolean} isDraw - Indique si le match est nul (égalité).
   * @throws {UnprocessableEntityException} Si l'un des joueurs n'existe pas.
   * @returns {{ winner: Player; loser: Player }} Les deux joueurs avec leurs nouveaux classements.
   */
  processMatch(
    winnerId: string,
    loserId: string,
    isDraw: boolean,
  ): { winner: Player; loser: Player } {
    const winner = this.getPlayer(winnerId);
    const loser = this.getPlayer(loserId);

    if (!winner || !loser) {
      throw new UnprocessableEntityException(
        "L'un des joueurs spécifiés n'existe pas.",
      );
    }

    // Score réel (W) : 1 pour victoire, 0 pour défaite, 0.5 pour nul
    const scoreWinner = isDraw ? 0.5 : 1;
    const scoreLoser = isDraw ? 0.5 : 0;

    // Espérance de victoire (We)
    const expectedWinner = this.calculateExpectedScore(winner.rank, loser.rank);
    const expectedLoser = this.calculateExpectedScore(loser.rank, winner.rank);

    // Calcul des nouveaux rangs
    winner.rank = Math.round(
      winner.rank + this.K_FACTOR * (scoreWinner - expectedWinner),
    );
    loser.rank = Math.round(
      loser.rank + this.K_FACTOR * (scoreLoser - expectedLoser),
    );

    // Archivage
    this.matches.push({
      winnerId,
      loserId,
      isDraw,
      date: new Date(),
    });

    // Émission des événements pour le temps réel
    this.rankingEvents$.next(winner);
    this.rankingEvents$.next(loser);

    return { winner, loser };
  }

  /**
   * Calcule l'espérance de victoire (We) du joueur A contre le joueur B.
   * Formule : 1 / (1 + 10^((Rb - Ra) / 400))
   * * @param {number} ratingA - Classement du joueur A.
   * @param {number} ratingB - Classement du joueur B.
   * @returns {number} Probabilité de victoire (entre 0 et 1).
   */
  private calculateExpectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  /**
   * Calcule le classement initial pour un nouveau joueur.
   * @returns {number} La moyenne des classements actuels ou 1200 par défaut.
   */
  private calculateInitialRank(): number {
    if (this.players.length === 0) {
      return this.DEFAULT_INITIAL_RANK;
    }
    const totalRank = this.players.reduce((sum, p) => sum + p.rank, 0);
    return Math.round(totalRank / this.players.length);
  }
}
