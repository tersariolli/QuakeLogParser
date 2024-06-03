import events from 'events';
import * as fs from 'fs';
import readline from 'readline';
import { LogParser } from '../src/lib/LogParser';

jest.mock('fs');
jest.mock('readline');
jest.mock('events');

describe('LogParser', () => {
    afterAll(() => {
        jest.clearAllMocks();
    });

    it('should instantiate LogParser correctly', () => {
        const logFile = 'log.log';
        const parser = new LogParser(logFile);
        expect(parser['logFile']).toBe(logFile);
        expect(parser['matches']).toEqual([]);
        expect(parser['currentMatch']).toBeNull();
    });

    it('should parse log file', async () => {
        const mockReadStream = {
            on: jest.fn((event, callback) => {
                if (event === 'line') {
                    callback(' 0:00 InitGame: \\sv_floodProtect\\1\\g_maxGameClients\\0\\timelimit\\15\\fraglimit\\20\\dmflags\\0\\version\\ioq3 1.36 linux-x86_64 Dec 20 2006\\protocol\\68\\mapname\\q3dm17\\sv_privateClients\\0\\sv_hostname\\Code Test Server\\sv_maxclients\\16\\sv_minRate\\0\\sv_maxRate\\0\\sv_dlRate\\100\\sv_allowDownload\\0\\bot_minplayers\\0\\gamename\\baseq3\\g_needpass\\0');
                    callback(' 0:25 ClientConnect: 2');
                }
                return mockReadStream;
            }),
            close: jest.fn()
        };
        (fs.createReadStream as jest.Mock).mockReturnValue(mockReadStream);
        (readline.createInterface as jest.Mock).mockReturnValue(mockReadStream);
        (events.once as jest.Mock).mockResolvedValueOnce(undefined);

        const parser = new LogParser('mock.log');
        const matches = await parser.parse();

        expect(matches.length).toBe(1);
        expect(matches[0].players.size).toBe(1);
        expect(matches[0].players.get('2')).toEqual({
            id: '2',
            name: null,
            kills: 0,
            deaths: 0
        });
    });

    it('should parse InitGame event', async () => {
        const mockReadStream = {
            on: jest.fn((event, callback) => {
                if (event === 'line') {
                    callback(' 10:22 InitGame: \\sv_floodProtect\\1\\g_maxGameClients\\0\\timelimit\\15\\fraglimit\\20\\dmflags\\0\\version\\ioq3 1.36 linux-x86_64 Dec 20 2006\\protocol\\68\\mapname\\q3dm17\\sv_privateClients\\0\\sv_hostname\\Code Test Server\\sv_maxclients\\16\\sv_minRate\\0\\sv_maxRate\\0\\sv_dlRate\\100\\sv_allowDownload\\0\\bot_minplayers\\0\\gamename\\baseq3\\g_needpass\\0');
                }
                return mockReadStream;
            }),
            close: jest.fn()
        };
        (fs.createReadStream as jest.Mock).mockReturnValue(mockReadStream);
        (readline.createInterface as jest.Mock).mockReturnValue(mockReadStream);
        (events.once as jest.Mock).mockResolvedValueOnce(undefined);

        const parser = new LogParser('mock.log');
        const matches = await parser.parse();

        expect(matches.length).toBe(1);
        expect(matches[0].id).toBe(0);
        expect(matches[0].kills_by_means.size).toBe(0);
        expect(matches[0].players.size).toBe(0);
        expect(matches[0].total_kills).toBe(0);
        expect(matches[0].exitReason).toBe('unknown');
        expect(JSON.stringify(matches[0].properties)).toBe(
            JSON.stringify({
                sv_floodProtect: '1',
                g_maxGameClients: '0',
                timelimit: '15',
                fraglimit: '20',
                dmflags: '0',
                version: 'ioq3 1.36 linux-x86_64 Dec 20 2006',
                protocol: '68',
                mapname: 'q3dm17',
                sv_privateClients: '0',
                sv_hostname: 'Code Test Server',
                sv_maxclients: '16',
                sv_minRate: '0',
                sv_maxRate: '0',
                sv_dlRate: '100',
                sv_allowDownload: '0',
                bot_minplayers: '0',
                gamename: 'baseq3',
                g_needpass: '0'
            })
        );
    });

    it('should parse Exit event', async () => {
        const mockReadStream = {
            on: jest.fn((event, callback) => {
                if (event === 'line') {
                    callback(' 10:22 InitGame: \\sv_floodProtect\\1\\g_maxGameClients\\0\\timelimit\\15\\fraglimit\\20\\dmflags\\0\\version\\ioq3 1.36 linux-x86_64 Dec 20 2006\\protocol\\68\\mapname\\q3dm17\\sv_privateClients\\0\\sv_hostname\\Code Test Server\\sv_maxclients\\16\\sv_minRate\\0\\sv_maxRate\\0\\sv_dlRate\\100\\sv_allowDownload\\0\\bot_minplayers\\0\\gamename\\baseq3\\g_needpass\\0');
                    callback(' 10:30 Exit: Capturelimit hit.');
                }
                return mockReadStream;
            }),
            close: jest.fn()
        };
        (fs.createReadStream as jest.Mock).mockReturnValue(mockReadStream);
        (readline.createInterface as jest.Mock).mockReturnValue(mockReadStream);
        (events.once as jest.Mock).mockResolvedValueOnce(undefined);

        const parser = new LogParser('mock.log');
        const matches = await parser.parse();

        expect(matches.length).toBe(1);
        expect(matches[0].id).toBe(0);
        expect(matches[0].exitReason).toBe('Capturelimit hit');
    });

    it('should parse Kill event', async () => {
        const mockReadStream = {
            on: jest.fn((event, callback) => {
                if (event === 'line') {
                    callback(' 0:00 InitGame: \\capturelimit\\8\\g_maxGameClients\\0\\timelimit\\15\\fraglimit\\20\\dmflags\\0\\bot_minplayers\\0\\sv_allowDownload\\0\\sv_maxclients\\16\\sv_privateClients\\2\\g_gametype\\4\\sv_hostname\\Code Miner Server\\sv_minRate\\0\\sv_maxRate\\10000\\sv_minPing\\0\\sv_maxPing\\0\\sv_floodProtect\\1\\version\\ioq3 1.36 linux-x86_64 Apr 12 2009\\protocol\\68\\mapname\\q3dm17\\gamename\\baseq3\\g_needpass\\0');
                    callback(' 0:00 ClientConnect: 2');
                    callback(' 0:00 ClientConnect: 3');
                    callback(' 0:00 ClientConnect: 4');
                    callback(' 0:00 ClientConnect: 5');
                    callback(' 0:00 ClientConnect: 6');
                    callback(' 0:00 ClientUserinfoChanged: 2 n\\Dono da Bola\\t\\3\\model\\sarge\\hmodel\\sarge\\g_redteam\\\\g_blueteam\\\\c1\\4\\c2\\5\\hc\\95\\w\\0\\l\\0\\tt\\0\\tl\\0');
                    callback(' 0:00 ClientUserinfoChanged: 3 n\\Oootsimo\\t\\2\\model\\razor/id\\hmodel\\razor/id\\g_redteam\\\\g_blueteam\\\\c1\\3\\c2\\5\\hc\\100\\w\\0\\l\\0\\tt\\0\\tl\\1');
                    callback(' 0:00 ClientUserinfoChanged: 4 n\\Isgalamido\\t\\1\\model\\uriel/zael\\hmodel\\uriel/zael\\g_redteam\\\\g_blueteam\\\\c1\\5\\c2\\5\\hc\\100\\w\\0\\l\\0\\tt\\0\\tl\\1');
                    callback(' 0:00 ClientUserinfoChanged: 5 n\\Assasinu Credi\\t\\3\\model\\james\\hmodel\\*james\\g_redteam\\\\g_blueteam\\\\c1\\4\\c2\\5\\hc\\100\\w\\0\\l\\0\\tt\\0\\tl\\0');
                    callback(' 0:00 ClientUserinfoChanged: 6 n\\Zeh\\t\\3\\model\\sarge/default\\hmodel\\sarge/default\\g_redteam\\\\g_blueteam\\\\c1\\1\\c2\\5\\hc\\100\\w\\0\\l\\0\\tt\\0\\tl\\0');
                    callback(' 0:27 Kill: 1022 2 19: <world> killed Dono da Bola by MOD_FALLING');
                    callback(' 0:32 Kill: 1022 6 22: <world> killed Zeh by MOD_TRIGGER_HURT');
                    callback(' 0:33 Kill: 1022 5 22: <world> killed Assasinu Credi by MOD_TRIGGER_HURT');
                    callback(' 0:42 Kill: 1022 3 22: <world> killed Oootsimo by MOD_TRIGGER_HURT');
                    callback(' 0:50 Kill: 1022 5 19: <world> killed Assasinu Credi by MOD_FALLING');
                    callback(' 0:54 Kill: 1022 2 22: <world> killed Dono da Bola by MOD_TRIGGER_HURT');
                    callback(' 1:11 Kill: 1022 4 19: <world> killed Isgalamido by MOD_FALLING');
                    callback(' 1:25 Kill: 4 5 10: Isgalamido killed Assasinu Credi by MOD_RAILGUN');
                    callback(' 1:28 Kill: 6 3 10: Zeh killed Oootsimo by MOD_RAILGUN');
                    callback(' 1:51 Kill: 1022 5 22: <world> killed Assasinu Credi by MOD_TRIGGER_HURT');
                    callback(' 1:52 Exit: Timelimit hit.');
                    callback(' 1:53 ShutdownGame:');
                }
                return mockReadStream;
            }),
            close: jest.fn()
        };
        (fs.createReadStream as jest.Mock).mockReturnValue(mockReadStream);
        (readline.createInterface as jest.Mock).mockReturnValue(mockReadStream);
        (events.once as jest.Mock).mockResolvedValueOnce(undefined);

        const parser = new LogParser('mock.log');
        const matches = await parser.parse();

        expect(matches.length).toBe(1);
        expect(matches[0].id).toBe(0);
        expect(matches[0].total_kills).toBe(10);
        expect(matches[0].players.size).toBe(5);

        expect(matches[0].players.get('2').kills).toBe(-2);
        expect(matches[0].players.get('3').kills).toBe(-1);
        expect(matches[0].players.get('4').kills).toBe(0);
        expect(matches[0].players.get('5').kills).toBe(-3);
        expect(matches[0].players.get('6').kills).toBe(0);

        expect(matches[0].players.get('2').deaths).toBe(2);
        expect(matches[0].players.get('3').deaths).toBe(2);
        expect(matches[0].players.get('4').deaths).toBe(1);
        expect(matches[0].players.get('5').deaths).toBe(4);
        expect(matches[0].players.get('6').deaths).toBe(1);

        expect(matches[0].kills_by_means.size).toBe(3);
        expect(matches[0].kills_by_means.get('MOD_TRIGGER_HURT')).toBe(5);
        expect(matches[0].kills_by_means.get('MOD_FALLING')).toBe(3);
        expect(matches[0].kills_by_means.get('MOD_RAILGUN')).toBe(2);

        expect(matches[0].exitReason).toBe('Timelimit hit');
    });

    it('should parse Item event', async () => {
        const mockReadStream = {
            on: jest.fn((event, callback) => {
                if (event === 'line') {
                    callback(' 0:00 InitGame: \\capturelimit\\8\\g_maxGameClients\\0\\timelimit\\15\\fraglimit\\20\\dmflags\\0\\bot_minplayers\\0\\sv_allowDownload\\0\\sv_maxclients\\16\\sv_privateClients\\2\\g_gametype\\4\\sv_hostname\\Code Miner Server\\sv_minRate\\0\\sv_maxRate\\10000\\sv_minPing\\0\\sv_maxPing\\0\\sv_floodProtect\\1\\version\\ioq3 1.36 linux-x86_64 Apr 12 2009\\protocol\\68\\mapname\\q3dm17\\gamename\\baseq3\\g_needpass\\0');
                    callback(' 0:00 ClientConnect: 2');
                    callback(' 0:00 ClientConnect: 3');
                    callback(' 0:00 ClientUserinfoChanged: 2 n\\Dono da Bola\\t\\3\\model\\sarge\\hmodel\\sarge\\g_redteam\\\\g_blueteam\\\\c1\\4\\c2\\5\\hc\\95\\w\\0\\l\\0\\tt\\0\\tl\\0');
                    callback(' 0:00 ClientUserinfoChanged: 3 n\\Oootsimo\\t\\2\\model\\razor/id\\hmodel\\razor/id\\g_redteam\\\\g_blueteam\\\\c1\\3\\c2\\5\\hc\\100\\w\\0\\l\\0\\tt\\0\\tl\\1');
                    callback(' 0:05 Item: 3 weapon_rocketlauncher');
                    callback(' 0:06 Item: 3 ammo_rockets');
                    callback(' 0:09 Item: 2 weapon_rocketlauncher');
                    callback(' 0:18 Item: 2 item_health_large');
                    callback(' 1:53 ShutdownGame:');
                }
                return mockReadStream;
            }),
            close: jest.fn()
        };
        (fs.createReadStream as jest.Mock).mockReturnValue(mockReadStream);
        (readline.createInterface as jest.Mock).mockReturnValue(mockReadStream);
        (events.once as jest.Mock).mockResolvedValueOnce(undefined);

        const parser = new LogParser('mock.log');
        const matches = await parser.parse();

        expect(matches.length).toBe(1);
        expect(matches[0].id).toBe(0);
        const eventItemLogs = matches[0].log.filter(log => log.event === 'Item');
        expect(eventItemLogs.length).toBe(4);

        expect(eventItemLogs[0].time).toBe('0:05');
        expect(eventItemLogs[0].properties['playerId']).toBe('3');
        expect(eventItemLogs[0].properties['item']).toBe('weapon_rocketlauncher');
        expect(eventItemLogs[0].description).toBe('0:05 "Oootsimo" picked up "weapon_rocketlauncher"');

        expect(eventItemLogs[1].time).toBe('0:06');
        expect(eventItemLogs[1].properties['playerId']).toBe('3');
        expect(eventItemLogs[1].properties['item']).toBe('ammo_rockets');
        expect(eventItemLogs[1].description).toBe('0:06 "Oootsimo" picked up "ammo_rockets"');

        expect(eventItemLogs[2].time).toBe('0:09');
        expect(eventItemLogs[2].properties['playerId']).toBe('2');
        expect(eventItemLogs[2].properties['item']).toBe('weapon_rocketlauncher');
        expect(eventItemLogs[2].description).toBe('0:09 "Dono da Bola" picked up "weapon_rocketlauncher"');

        expect(eventItemLogs[3].time).toBe('0:18');
        expect(eventItemLogs[3].properties['playerId']).toBe('2');
        expect(eventItemLogs[3].properties['item']).toBe('item_health_large');
        expect(eventItemLogs[3].description).toBe('0:18 "Dono da Bola" picked up "item_health_large"');
    });
});
