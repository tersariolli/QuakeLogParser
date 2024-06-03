export interface Player {
    id: string;
    name: string;
    kills: number;
    deaths: number;
    team?: string;
    model?: string;
    headModel?: string;
    redTeam?: string;
    blueTeam?: string;
    primaryColor?: string;
    secondaryColor?: string;
    health?: string;
    weapon?: string;
    latency?: string;
    totalTime?: string;
    totalLives?: string;
}
