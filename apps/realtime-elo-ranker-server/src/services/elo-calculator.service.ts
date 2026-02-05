import { Injectable } from '@nestjs/common';

/**
 * Service dédié au calcul du classement Elo.
 * Encapsule toute la logique mathématique liée au système Elo.
 */
@Injectable()
export class EloCalculatorService {
  /**
   * Facteur K (Coefficient de développement).
   * Détermine la vitesse à laquelle le classement change.
   * K=32 est une valeur standard pour les débutants/systèmes simples.
   */
  private readonly K_FACTOR = 32;

  /**
   * Classement par défaut attribué au tout premier joueur
   */
  private readonly DEFAULT_INITIAL_RANK = 1200;

  /**
   * Calcule l'espérance de victoire (We) du joueur A contre le joueur B.
   * Formule : 1 / (1 + 10^((Rb - Ra) / 400))
   *
   * @param {number} ratingA - Classement du joueur A.
   * @param {number} ratingB - Classement du joueur B.
   * @returns {number} Probabilité de victoire (entre 0 et 1).
   */
  calculateExpectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  /**
   * Calcule le nouveau classement d'un joueur après un match.
   * Formule de mise à jour : Rn = Ro + K * (W - We)
   *
   * @param {number} currentRank - Classement actuel du joueur
   * @param {number} expectedScore - Espérance de victoire (We)
   * @param {number} actualScore - Score réel (1 pour victoire, 0.5 pour nul, 0 pour défaite)
   * @returns {number} Nouveau classement arrondi
   */
  calculateNewRank(
    currentRank: number,
    expectedScore: number,
    actualScore: number,
  ): number {
    return Math.round(currentRank + this.K_FACTOR * (actualScore - expectedScore));
  }

  /**
   * Calcule le classement initial pour un nouveau joueur.
   *
   * @param {number[]} existingRanks - Liste des classements des joueurs existants
   * @returns {number} La moyenne des classements actuels ou 1200 par défaut
   */
  calculateInitialRank(existingRanks: number[]): number {
    if (existingRanks.length === 0) {
      return this.DEFAULT_INITIAL_RANK;
    }
    const totalRank = existingRanks.reduce((sum, rank) => sum + rank, 0);
    return Math.round(totalRank / existingRanks.length);
  }

  /**
   * Récupère le facteur K utilisé pour les calculs
   */
  getKFactor(): number {
    return this.K_FACTOR;
  }

  /**
   * Récupère le classement initial par défaut
   */
  getDefaultInitialRank(): number {
    return this.DEFAULT_INITIAL_RANK;
  }
}
