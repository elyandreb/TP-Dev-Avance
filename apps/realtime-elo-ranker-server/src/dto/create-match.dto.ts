import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

/**
 * DTO pour la déclaration d'un résultat de match.
 */
export class CreateMatchDto {
  /**
   * Identifiant du vainqueur (ou joueur 1 si match nul)
   */
  @IsString()
  @IsNotEmpty({ message: "L'identifiant du gagnant ne peut pas être vide" })
  winner: string;

  /**
   * Identifiant du perdant (ou joueur 2 si match nul)
   */
  @IsString()
  @IsNotEmpty({ message: "L'identifiant du perdant ne peut pas être vide" })
  loser: string;

  /**
   * True si le match est une égalité
   */
  @IsBoolean()
  @IsOptional()
  draw?: boolean;
}
