import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { Player } from '../entities/player.entity';

/**
 * Service Singleton pour gérer le cache du classement et les événements temps réel.
 * Responsabilité : Gestion des événements SSE et du cache en mémoire.
 */
@Injectable()
export class RankingService {
  /**
   * Subject RxJS permettant d'émettre des événements de mise à jour de classement.
   * Agit comme un bus d'événements interne pour le temps réel.
   */
  private rankingEvents$ = new Subject<Player>();

  /**
   * Cache en mémoire du classement actuel.
   * Permet d'éviter des requêtes BDD pour chaque événement SSE.
   */
  private rankingCache: Player[] = [];

  /**
   * Retourne un Observable émettant les joueurs dont le classement vient de changer.
   * Utilisé par le contrôleur pour le flux SSE (Server-Sent Events).
   *
   * @returns {Observable<Player>} Un flux d'objets Player mis à jour.
   */
  getRankingUpdates(): Observable<Player> {
    return this.rankingEvents$.asObservable();
  }

  /**
   * Émet un événement de mise à jour pour un joueur.
   * Le joueur sera envoyé à tous les clients connectés via SSE.
   *
   * @param {Player} player - Le joueur dont le classement a changé
   */
  emitRankingUpdate(player: Player): void {
    this.rankingEvents$.next(player);
  }

  /**
   * Met à jour le cache du classement.
   *
   * @param {Player[]} players - Liste complète des joueurs triés
   */
  updateCache(players: Player[]): void {
    this.rankingCache = [...players];
  }

  /**
   * Récupère le classement depuis le cache.
   *
   * @returns {Player[]} Le classement en cache
   */
  getCachedRanking(): Player[] {
    return [...this.rankingCache];
  }

  /**
   * Vide le cache (utile pour les tests).
   */
  clearCache(): void {
    this.rankingCache = [];
  }
}
