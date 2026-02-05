import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getApiInfo() {
    return {
      name: 'Realtime ELO Ranker API',
      version: '1.0.0',
      endpoints: {
        player: {
          'POST /api/player': 'Créer un nouveau joueur',
        },
        match: {
          'POST /api/match': 'Enregistrer un résultat de match',
        },
        ranking: {
          'GET /api/ranking': 'Obtenir le classement actuel',
          'GET /api/ranking/events': 'Stream SSE des mises à jour en temps réel',
        },
      },
      documentation: 'Consultez /docs pour la documentation Swagger (si activée)',
    };
  }
}
