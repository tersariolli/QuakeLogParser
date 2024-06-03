import { JsonObject } from './JsonObject';

export interface EventLog {
    time: string;
    event: string;
    description: string;
    properties?: JsonObject;
}
