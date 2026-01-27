declare module "sql.js" {
    export interface SqlJsStatic {
        Database: typeof Database;
    }

    export interface QueryExecResult {
        columns: string[];
        values: (string | number | Uint8Array | null)[][];
    }

    export class Database {
        constructor(data?: ArrayLike<number> | Buffer | null);
        run(sql: string, params?: any[]): Database;
        exec(sql: string, params?: any[]): QueryExecResult[];
        close(): void;
    }

    export interface SqlJsConfig {
        locateFile?: (filename: string) => string;
    }

    export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
}
