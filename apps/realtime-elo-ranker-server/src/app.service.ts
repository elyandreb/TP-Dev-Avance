import { ConflictException, Injectable } from '@nestjs/common';

// Définition des modèles de données (in-memory)
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

  // Constante pour le premier joueur si la moyenne n'est pas calculable
  private readonly DEFAULT_INITIAL_RANK = 1200;

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
   * Crée un nouveau joueur selon les règles de gestion :
   * - ID unique
   * - Classement initial = moyenne des joueurs existants (ou 1200 par défaut)
   */
  createPlayer(id: string): Player {
    if (this.getPlayer(id)) {
      throw new ConflictException(`Le joueur avec l'ID "${id}" existe déjà.`);
    }

    const initialRank = this.calculateInitialRank();

    const newPlayer: Player = {
      id,
      rank: initialRank,
    };

    this.players.push(newPlayer);
    return newPlayer;
  }

  /**
   * Calcule le rang initial basé sur la moyenne des classements actuels.
   * Retourne 1200 si aucun joueur n'existe.
   */
  private calculateInitialRank(): number {
    if (this.players.length === 0) {
      return this.DEFAULT_INITIAL_RANK;
    }

    const totalRank = this.players.reduce((sum, p) => sum + p.rank, 0);
    return Math.round(totalRank / this.players.length);
  }
}
