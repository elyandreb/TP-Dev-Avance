"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
let AppService = class AppService {
    players = [];
    matches = [];
    DEFAULT_INITIAL_RANK = 1200;
    K_FACTOR = 32;
    getAllPlayers() {
        return [...this.players].sort((a, b) => b.rank - a.rank);
    }
    getPlayer(id) {
        return this.players.find((p) => p.id === id);
    }
    createPlayer(id) {
        if (this.getPlayer(id)) {
            throw new common_1.ConflictException(`Le joueur avec l'ID "${id}" existe déjà.`);
        }
        const initialRank = this.calculateInitialRank();
        const newPlayer = { id, rank: initialRank };
        this.players.push(newPlayer);
        return newPlayer;
    }
    processMatch(winnerId, loserId, isDraw) {
        const winner = this.getPlayer(winnerId);
        const loser = this.getPlayer(loserId);
        if (!winner || !loser) {
            throw new common_1.UnprocessableEntityException("L'un des joueurs spécifiés n'existe pas.");
        }
        const scoreWinner = isDraw ? 0.5 : 1;
        const scoreLoser = isDraw ? 0.5 : 0;
        const expectedWinner = this.calculateExpectedScore(winner.rank, loser.rank);
        const expectedLoser = this.calculateExpectedScore(loser.rank, winner.rank);
        const newRankWinner = winner.rank + this.K_FACTOR * (scoreWinner - expectedWinner);
        const newRankLoser = loser.rank + this.K_FACTOR * (scoreLoser - expectedLoser);
        winner.rank = Math.round(newRankWinner);
        loser.rank = Math.round(newRankLoser);
        this.matches.push({
            winnerId,
            loserId,
            isDraw,
            date: new Date(),
        });
        return { winner, loser };
    }
    calculateExpectedScore(ratingA, ratingB) {
        return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    }
    calculateInitialRank() {
        if (this.players.length === 0) {
            return this.DEFAULT_INITIAL_RANK;
        }
        const totalRank = this.players.reduce((sum, p) => sum + p.rank, 0);
        return Math.round(totalRank / this.players.length);
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)()
], AppService);
//# sourceMappingURL=app.service.js.map