import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO pour la création d'un joueur.
 */
export class CreatePlayerDto {
  /**
   * Identifiant unique souhaité pour le joueur
   */
  @IsString()
  @IsNotEmpty({ message: "L'identifiant du joueur ne peut pas être vide" })
  id: string;
}
