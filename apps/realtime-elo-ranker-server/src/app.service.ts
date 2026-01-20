import {
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';

export interface Player {
  id: string;
  rank: number;
}

export interface MatchResult {
  winnerId: string;
  loserId: string;
  isDraw: boolean;
  date: Date;
}

@Injectable()
export class AppService {
  private players: Player[] = [];
  private matches: MatchResult[] = [];

  private readonly DEFAULT_INITIAL_RANK = 1200;
  private readonly K_FACTOR = 32; // Coefficient de pondération

  /**
   * Récupère tous les joueurs triés par rang (du meilleur au moins bon)
   */
  getAllPlayers(): Player[] {
    return [...this.players].sort((a, b) => b.rank - a.rank);
  }

  /**
   * Trouve un joueur par son ID
   */
  getPlayer(id: string): Player | undefined {
    return this.players.find((p) => p.id === id);
  }

  /**
   * Crée un nouveau joueur
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
   * Traite un match, met à jour les classements et sauvegarde l'historique
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

    // Définition des scores réels (W)
    // Si match nul, les deux ont 0.5. Sinon vainqueur = 1, perdant = 0
    const scoreWinner = isDraw ? 0.5 : 1;
    const scoreLoser = isDraw ? 0.5 : 0;

    // Calcul des probabilités de victoire (We)
    const expectedWinner = this.calculateExpectedScore(winner.rank, loser.rank);
    const expectedLoser = this.calculateExpectedScore(loser.rank, winner.rank);

    // Mise à jour des rangs (Rn = Ro + K * (W - We))
    const newRankWinner =
      winner.rank + this.K_FACTOR * (scoreWinner - expectedWinner);
    const newRankLoser =
      loser.rank + this.K_FACTOR * (scoreLoser - expectedLoser);

    // Application de l'arrondi et mise à jour des objets
    winner.rank = Math.round(newRankWinner);
    loser.rank = Math.round(newRankLoser);

    // Sauvegarde du match
    this.matches.push({
      winnerId,
      loserId,
      isDraw,
      date: new Date(),
    });

    return { winner, loser };
  }

  /**
   * Calcule l'espérance de victoire (We) pour le joueur A contre le joueur B.
   * Formule : 1 / (1 + 10^((Rb - Ra) / 400))
   */
  private calculateExpectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  /**
   * Calcule le rang initial (Moyenne ou 1200)
   */
  private calculateInitialRank(): number {
    if (this.players.length === 0) {
      return this.DEFAULT_INITIAL_RANK;
    }
    const totalRank = this.players.reduce((sum, p) => sum + p.rank, 0);
    return Math.round(totalRank / this.players.length);
  }
}
