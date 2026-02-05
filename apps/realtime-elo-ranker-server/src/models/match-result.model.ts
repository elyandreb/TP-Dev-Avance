/**
 * Représente le résultat archivé d'un match.
 * Structure métier utilisée pour conserver l'historique des matchs.
 */
export interface MatchResult {
  /**
   * Identifiant du vainqueur (ou joueur 1 si match nul)
   */
  winnerId: string;

  /**
   * Identifiant du perdant (ou joueur 2 si match nul)
   */
  loserId: string;

  /**
   * Indique si le match s'est terminé par une égalité
   */
  isDraw: boolean;

  /**
   * Date et heure du match
   */
  date: Date;
}
