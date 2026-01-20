import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
} from '@nestjs/common';
import * as appService_1 from './app.service';

// DTOs pour typer les requêtes entrantes
class CreatePlayerDto {
  id: string;
}

class CreateMatchDto {
  winner: string;
  loser: string;
  draw: boolean;
}

@Controller('api')
export class AppController {
  constructor(private readonly appService: appService_1.AppService) {}

  @Post('player')
  createPlayer(@Body() body: CreatePlayerDto): appService_1.Player {
    // Le service gère déjà la ConflictException (409) si le joueur existe
    return this.appService.createPlayer(body.id);
  }

  @Get('ranking')
  getRanking(): appService_1.Player[] {
    const players = this.appService.getAllPlayers();
    if (players.length === 0) {
      // Selon le Swagger, on renvoie 404 si aucun joueur n'existe
      throw new NotFoundException(
        "Le classement n'est pas disponible car aucun joueur n'existe",
      );
    }
    return players;
  }

  @Post('match')
  @HttpCode(200) // Par défaut POST renvoie 201, le Swagger demande 200
  createMatch(@Body() body: CreateMatchDto) {
    // Le service gère la UnprocessableEntityException (422) si un joueur n'existe pas
    return this.appService.processMatch(body.winner, body.loser, body.draw);
  }
}
