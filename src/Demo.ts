import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { MatchLog } from './interfaces/MatchLog';
import { LogParser } from './lib/LogParser';

class Demo {
    private matches: MatchLog[] = [];
    private selectedMatch: MatchLog = null;
    private rl: readline.Interface;

    constructor(rl: readline.Interface) {
        this.rl = rl;
    }

    async start() {
        console.log();
        console.log('Quake 3 Log Parser Demo');
        let filePath = await this.askLogFile();
        if (!fs.existsSync(filePath)) {
            console.log(`File not found: "${filePath}".`);
            filePath = path.resolve(__dirname, '../../logs/qgames.log.txt');
            console.log(`The sample file "${filePath}" will be used.`);
            console.log();
        }

        const parser = new LogParser(filePath);
        this.matches = await parser.parse();
        console.log(`${this.matches.length} matches found in the log file.`);

        this.selectedMatch = await this.getMatchLog();
        this.displayMatchOptions();
    }

    private askLogFile(): Promise<string> {
        return new Promise(resolve => {
            this.rl.question('Please enter the log file path and name, or leave it in blank to use a sample log file: ', filePath => {
                if (filePath) {
                    resolve(filePath);
                } else {
                    const sampleFile = path.resolve(__dirname, '../../logs/qgames.log.txt');
                    console.log(`The sample file "${sampleFile}" will be used.`);
                    resolve(sampleFile);
                }
            });
        });
    }

    private getMatchLog(): Promise<MatchLog> {
        return new Promise(resolve => {
            const askForId = () => {
                console.log(`Type the match id from 0 to ${this.matches.length - 1} for more details:`);
                this.rl.question('', input => {
                    const id = parseInt(input.trim());
                    const match = this.matches[id];
                    if (!match) {
                        console.log(`Invalid match id: "${input}". Please try again.`);
                        askForId();
                    } else {
                        resolve(match);
                    }
                });
            };
            askForId();
        });
    }

    private displayMatchOptions(): void {
        console.log();
        console.log(`Select an option for match #${this.selectedMatch.id}:`);
        console.log('1: Display match properties');
        console.log('2: Display players sorted by performance');
        console.log('3: Display kills by means');
        console.log('4: Display parsed match log as object');
        console.log('5: Display parsed match log as string');
        console.log('8: Select another match');
        console.log('9: Exit');

        this.rl.removeAllListeners('line');

        this.rl.on('line', async input => {
            switch (input.trim()) {
                case '1':
                    console.log('Match properties:');
                    console.log('ID:', this.selectedMatch.id);
                    console.log('Total Kills:', this.selectedMatch.total_kills);
                    console.log('Exit Reason:', this.selectedMatch.exitReason);
                    console.log('Properties:', this.selectedMatch.properties);
                    break;
                case '2':
                    console.log('Players sorted by performance:');
                    console.log(this.selectedMatch.players);
                    break;
                case '3':
                    console.log('Kills by means');
                    console.log(this.selectedMatch.kills_by_means);
                    break;
                case '4':
                    console.log('Parsed match log (object)');
                    console.log(this.selectedMatch.log);
                    break;
                case '5':
                    console.log('Parsed match log (string)');
                    this.selectedMatch.log.forEach(log => console.log(log.description));
                    break;
                case '8':
                    this.selectedMatch = await this.getMatchLog();
                    this.displayMatchOptions();
                    return;
                case '9':
                    this.rl.close();
                    break;
                default:
                    console.log(`Invalid option: ${input.trim()}`);
            }
            this.displayMatchOptions();
        });
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

new Demo(rl).start();

rl.on('close', () => process.exit(0));
