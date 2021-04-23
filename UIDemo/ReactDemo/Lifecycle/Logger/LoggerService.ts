export interface ILog {
    title: string,
    success: boolean
}

export default class LoggerService {
    private static instance: LoggerService;
    private logs: ILog[] = [];
    private _subscribes = [];

    add(log: string, success: boolean = false): void {
        this.logs.unshift({
            title: log,
            success
        });
        this._subscribes.forEach((fn) => {
            fn(this.logs);
        });
    }

    get(): ILog[] {
        return this.logs;
    }

    clear(): void {
        this.logs = [];
        this._subscribes.forEach((fn) => {
            fn(this.logs);
        });
    }

    subscribe(cb: Function): void {
        this._subscribes.push(cb);
        cb(this.logs);
    }

    public static getInstance(): LoggerService {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }

        return LoggerService.instance;
    }
}
