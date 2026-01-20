import { MessageEvent } from '@nestjs/common';
import * as appService_1 from './app.service';
import { Observable } from 'rxjs';
declare class CreatePlayerDto {
    id: string;
}
declare class CreateMatchDto {
    winner: string;
    loser: string;
    draw: boolean;
}
export declare class AppController {
    private readonly appService;
    constructor(appService: appService_1.AppService);
    createPlayer(body: CreatePlayerDto): appService_1.Player;
    getRanking(): appService_1.Player[];
    createMatch(body: CreateMatchDto): {
        winner: appService_1.Player;
        loser: appService_1.Player;
    };
    rankingEvents(): Observable<MessageEvent>;
}
export {};
