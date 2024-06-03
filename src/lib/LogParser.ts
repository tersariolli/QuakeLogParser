import events from 'events';
import fs from 'fs';
import readline from 'readline';
import { EventLog } from '../interfaces/EventLog';
import { JsonObject } from '../interfaces/JsonObject';
import { MatchLog } from '../interfaces/MatchLog';
import { Player } from '../interfaces/Player';
import { Dictionary } from '../types/Dictionary';
import { EventProcessor } from '../types/EventProcessor';

export class LogParser {
    private logFile: string;
    private matches: MatchLog[] = [];
    private currentMatch: MatchLog = null;

    private eventProcessorMap: Dictionary<EventProcessor> = {
        InitGame: this.processEventInitGame,
        ShutdownGame: this.processEventShutdownGame,
        Exit: this.processEventExit,
        ClientConnect: this.processEventClientConnect,
        ClientBegin: this.processEventClientBegin,
        ClientDisconnect: this.processEventClientDisconnect,
        ClientUserinfoChanged: this.processEventClientUserinfoChanged,
        Kill: this.processEventKill,
        Item: this.processEventItem
    };

    constructor(logFile: string) {
        this.logFile = logFile;
    }

    public async parse(): Promise<MatchLog[]> {
        const reader = readline.createInterface({
            input: fs.createReadStream(this.logFile),
            crlfDelay: Infinity
        });
        reader.on('line', line => this.addEntry(line));
        await events.once(reader, 'close');
        return this.matches;
    }

    private createEventLog(time: string, event: string, description?: string, properties?: JsonObject): EventLog {
        return {
            time: time,
            event: event,
            description: description ?? `${time} ${event}`,
            properties: properties
        };
    }

    private addEntry(logEntry: string): void {
        const events = Object.keys(this.eventProcessorMap);
        const regex = new RegExp(`^\\s*(\\d{1,2}:\\d{2})\\s+(${events.join('|')}):\\s*(\\S.*\\S|\\S)?\\s*$`);
        const match = logEntry.match(regex);
        if (!match) return;
        const [_, time, event, data] = match;
        const parser = this.eventProcessorMap[event];
        if (!parser) throw new Error(`Unknown event: "${event}"`);
        const log = parser.call(this, time, data);
        this.matches[this.matches.length - 1].log.push(log);
    }

    private processEventClientBegin(time: string): EventLog {
        return this.createEventLog(time, 'ClientBegin');
    }

    private processEventClientDisconnect(time: string): EventLog {
        return this.createEventLog(time, 'ClientDisconnect');
    }

    private processEventClientConnect(time: string, data: string): EventLog {
        this.currentMatch.players.set(data, {
            id: data,
            name: null,
            kills: 0,
            deaths: 0
        });
        return this.createEventLog(time, 'ClientConnect');
    }

    private processEventExit(time: string, data: string): EventLog {
        const reason = data.endsWith('.') ? data.substring(0, data.length - 1) : data;
        this.currentMatch.exitReason = reason;
        return this.createEventLog(time, 'Exit');
    }

    private processEventInitGame(time: string, data: string): EventLog {
        if (this.currentMatch) {
            // Event ShutdownGame was not received and the previous match didn't end properly, so finalize it here.
            this.processEventShutdownGame(time);
        }

        this.currentMatch = {
            id: this.matches.length,
            players: new Map<string, Player>(),
            total_kills: 0,
            exitReason: 'unknown',
            properties: {},
            kills_by_means: new Map<string, number>(),
            log: []
        };

        this.matches.push(this.currentMatch);

        const keyValueRegex = /\\([^\\]+)\\([^\\]*)/g;
        let match: RegExpExecArray;
        while ((match = keyValueRegex.exec(data))) {
            this.currentMatch.properties[match[1]] = match[2];
        }

        const description = `${time} InitGame (${Object.keys(this.currentMatch.properties)
            .map(k => `${k}=${this.currentMatch.properties[k]}`)
            .join(', ')})`;
        return this.createEventLog(time, 'InitGame', description, this.currentMatch.properties);
    }

    private processEventShutdownGame(time: string): EventLog {
        //sort kills_by_means by kill count:
        this.currentMatch.kills_by_means = new Map([...this.currentMatch.kills_by_means.entries()].sort((a, b) => b[1] - a[1]));

        //sort players by kill count:
        this.currentMatch.players = new Map([...this.currentMatch.players.entries()].sort((a, b) => b[1].kills - a[1].kills));

        this.currentMatch = null;

        return this.createEventLog(time, 'ShutdownGame');
    }

    private processEventClientUserinfoChanged(time: string, data: string): EventLog {
        const regex = /^(\d+) n\\([^\\]+)\\t\\([^\\]*)\\model\\([^\\]+)\\hmodel\\([^\\]+)\\g_redteam\\([^\\]*)\\g_blueteam\\([^\\]*)\\c1\\(\d+)\\c2\\(\d+)\\hc\\(\d+)\\w\\(\d+)\\l\\(\d+)\\tt\\(\d*)\\tl\\(\d*)$/;
        const match = regex.exec(data);
        const player = this.currentMatch.players.get(match[1]);
        player.name = match[2];
        player.team = match[3];
        player.model = match[4];
        player.headModel = match[5];
        player.redTeam = match[6];
        player.blueTeam = match[7];
        player.primaryColor = match[8];
        player.secondaryColor = match[9];
        player.health = match[10];
        player.weapon = match[11];
        player.latency = match[12];
        player.totalTime = match[13];
        player.totalLives = match[14];

        const description = `${time} ClientUserinfoChanged (${Object.keys(player)
            .map(k => `${k}=${player[k]}`)
            .join(', ')})`;
        return this.createEventLog(time, 'ClientUserinfoChanged', description, { player: player });
    }

    private processEventItem(time: string, data: string): EventLog {
        const regex = /^(\d+) (\w+)$/;
        const match = regex.exec(data);
        if (!match) return;
        const [playerId, itemName] = [match[1], match[2]];
        const description = `${time} "${this.currentMatch.players.get(playerId).name}" picked up "${itemName}"`;
        return this.createEventLog(time, 'Item', description, {
            playerId: playerId,
            item: itemName
        });
    }

    private processEventKill(time: string, data: string): EventLog {
        const regex = /^(\d+)\s+(\d+)\s+(\d+):\s+(<\w+>|[\w\s]+)\s+killed\s+([\w\s]+)\s+by\s+(\w+)$/;
        const match = data.match(regex);
        if (!match) return;
        const [_, attackerId, victimId, _modId, attackerName, _victim, mod] = match;

        this.currentMatch.total_kills++;
        this.currentMatch.players.get(victimId).deaths++;

        if (attackerName === '<world>') {
            this.currentMatch.players.get(victimId).kills--;
        } else {
            this.currentMatch.players.get(attackerId).kills++;
        }

        const count = this.currentMatch.kills_by_means.get(mod) || 0;
        this.currentMatch.kills_by_means.set(mod, count + 1);

        const description = `${time} "${attackerName}" killed "${this.currentMatch.players.get(victimId).name}" using "${mod}"`;
        return this.createEventLog(time, 'Kill', description, {
            attackerId: attackerId,
            mod: mod
        });
    }
}
