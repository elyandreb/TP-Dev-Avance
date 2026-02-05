import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './controllers/app.controller';
import { PlayerController } from './controllers/player.controller';
import { MatchController } from './controllers/match.controller';
import { RankingController } from './controllers/ranking.controller';
import { PlayerService } from './services/player.service';
import { MatchService } from './services/match.service';
import { RankingService } from './services/ranking.service';
import { EloCalculatorService } from './services/elo-calculator.service';
import { Player } from './entities/player.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqljs',
      location: 'database.sqlite',
      autoSave: true,
      entities: [Player],
      synchronize: true, // Attention : à désactiver en production
    }),
    TypeOrmModule.forFeature([Player]),
  ],
  controllers: [AppController, PlayerController, MatchController, RankingController],
  providers: [
    PlayerService,
    MatchService,
    RankingService,
    EloCalculatorService,
  ],
})
export class AppModule {}

