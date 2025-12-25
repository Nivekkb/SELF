import type { Server } from "node:http";
export type SelfHttpAuthMode = "optional" | "required";
export interface SelfHttpServerOptions {
    host?: string;
    port?: number;
    cors?: {
        enabled: boolean;
        origin?: string;
    };
    auth?: {
        mode: SelfHttpAuthMode;
        apiKey?: string;
    };
    limits?: {
        maxBodyBytes?: number;
    };
    rateLimit?: {
        enabled: boolean;
        requestsPerMinute?: number;
    };
    logging?: {
        requestLogs?: boolean;
        selfLogs?: boolean;
        selfLogPath?: string;
    };
}
export interface StartResult {
    server: Server;
    url: string;
    host: string;
    port: number;
}
export declare function createSelfHttpServer(options?: SelfHttpServerOptions): Server;
export declare function startSelfHttpServer(options?: SelfHttpServerOptions): Promise<StartResult>;
//# sourceMappingURL=index.d.ts.map