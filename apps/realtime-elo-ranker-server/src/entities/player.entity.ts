import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * Entité représentant un joueur avec son identifiant et son classement Elo.
 */
@Entity('players')
export class Player {
  /**
   * Identifiant unique du joueur
   */
  @PrimaryColumn()
  id: string;

  /**
   * Classement Elo actuel du joueur
   */
  @Column({ type: 'integer' })
  rank: number;
}
