"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./controllers/app.controller");
const player_controller_1 = require("./controllers/player.controller");
const match_controller_1 = require("./controllers/match.controller");
const ranking_controller_1 = require("./controllers/ranking.controller");
const player_service_1 = require("./services/player.service");
const match_service_1 = require("./services/match.service");
const ranking_service_1 = require("./services/ranking.service");
const elo_calculator_service_1 = require("./services/elo-calculator.service");
const player_entity_1 = require("./entities/player.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'sqljs',
                location: 'database.sqlite',
                autoSave: true,
                entities: [player_entity_1.Player],
                synchronize: true,
            }),
            typeorm_1.TypeOrmModule.forFeature([player_entity_1.Player]),
        ],
        controllers: [app_controller_1.AppController, player_controller_1.PlayerController, match_controller_1.MatchController, ranking_controller_1.RankingController],
        providers: [
            player_service_1.PlayerService,
            match_service_1.MatchService,
            ranking_service_1.RankingService,
            elo_calculator_service_1.EloCalculatorService,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map