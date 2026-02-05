import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { MatchService } from '../services/match.service';
import { CreateMatchDto } from '../dto/create-match.dto';
import { Player } from '../entities/player.entity';

/**
 * Contrôleur pour la gestion des matchs.
 * Responsabilité : Gérer les entrées/sorties HTTP pour les matchs.
 */
@Controller('api/match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  /**
   * Enregistre un match et met à jour les classements.
   *
   * @param {CreateMatchDto} createMatchDto - Le résultat du match.
   * @returns {Promise<{ winner: Player; loser: Player }>} Les nouvelles données des deux joueurs impliqués.
   * @throws {UnprocessableEntityException} Si l'un des joueurs n'existe pas (géré par le service)
   */
  @Post()
  @HttpCode(200)
  async createMatch(
    @Body() createMatchDto: CreateMatchDto,
  ): Promise<{ winner: Player; loser: Player }> {
    return await this.matchService.processMatch(
      createMatchDto.winner,
      createMatchDto.loser,
      createMatchDto.draw || false,
    );
  }
}
