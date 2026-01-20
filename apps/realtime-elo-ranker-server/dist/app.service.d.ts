export interface Player {
    id: string;
    rank: number;
}
export interface MatchResult {
    winnerId: string;
    loserId: string;
    isDraw: boolean;
    date: Date;
}
export declare class AppService {
    private players;
    private matches;
    private readonly DEFAULT_INITIAL_RANK;
    private readonly K_FACTOR;
    getAllPlayers(): Player[];
    getPlayer(id: string): Player | undefined;
    createPlayer(id: string): Player;
    processMatch(winnerId: string, loserId: string, isDraw: boolean): {
        winner: Player;
        loser: Player;
    };
    private calculateExpectedScore;
    private calculateInitialRank;
}
