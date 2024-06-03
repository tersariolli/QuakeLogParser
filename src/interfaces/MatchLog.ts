import { Dictionary } from '../types/Dictionary';
import { EventLog } from './EventLog';
import { Player } from './Player';

export interface MatchLog {
    id: number;
    players: Map<string, Player>;
    total_kills: number;
    kills_by_means: Map<string, number>;
    properties: Dictionary<string>;
    exitReason: string;
    log: EventLog[];
}
