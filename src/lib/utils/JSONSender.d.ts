export class CommandQueue {
    constructor(limit: any, maxQueueSize: any);
    queue: any[];
    inFlight: number;
    limit: any;
    maxQueueSize: any;
    enqueue(fn: any): Promise<any>;
    processQueue(): Promise<void>;
}
export function sendCommand(ws: any, cmd: any): void;
export function commandWithResponse(ws: any, cmd: any): Promise<any>;
export function sendSubscribe(ws: any, event: any): void;
export function sayText(ws: any, text: any, player?: string): void;
export function sendTitle(ws: any, text: any, player: any, type?: string): void;
export function queryTarget(ws: any, target: any, extra?: boolean): Promise<{
    position: Vec3;
    roundedPosition: Vec3;
    yRot: any;
    id: any;
}>;
export function getPing(ws: any, amount?: number): Promise<number>;
export function getBlock(ws: any, pos: any): Promise<any>;
export function getArea(ws: any, start: any, end: any): Promise<any>;
export function raycastBlock(ws: any, origin: any, direction: any, range?: number, precision?: number): Promise<any>;
export function locateEntity(ws: any, name: any): Promise<Vec3>;
export function loadStructure(client: any, data: any, extension: any): Promise<void>;
import { Vec3 } from "vec3";
