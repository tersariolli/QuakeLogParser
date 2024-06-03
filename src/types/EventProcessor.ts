import { EventLog } from '../interfaces/EventLog';

export type EventProcessor = (time: string, data?: string) => EventLog;
