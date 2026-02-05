import { Controller, Post, Body, HttpCode, BadRequestException } from '@nestjs/common';
import { PlayerService } from '../services/player.service';
import { CreatePlayerDto } from '../dto/create-player.dto';
import { Player } from '../entities/player.entity';

/**
 * Contrôleur pour la gestion des joueurs.
 * Responsabilité : Gérer les entrées/sorties HTTP pour les joueurs.
 */
@Controller('api/player')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  /**
   * Crée un nouveau joueur.
   *
   * @param {CreatePlayerDto} createPlayerDto - Les données du joueur.
   * @returns {Promise<Player>} Le joueur créé avec son rang initial.
   * @throws {BadRequestException} Si l'ID est invalide
   * @throws {ConflictException} Si le joueur existe déjà (géré par le service)
   */
  @Post()
  @HttpCode(200)
  async createPlayer(@Body() createPlayerDto: CreatePlayerDto): Promise<Player> {
    if (!createPlayerDto.id || createPlayerDto.id.trim() === '') {
      throw new BadRequestException("L'identifiant du joueur n'est pas valide");
    }
    return await this.playerService.createPlayer(createPlayerDto.id);
  }
}
