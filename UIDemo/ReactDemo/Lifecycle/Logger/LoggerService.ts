export interface ILog {
    date: Date,
    title: string,
}

export default class LoggerService {
    private static instance: LoggerService;
    private logs: ILog[] = [];
    private _subscribes = [];

    add(log: string): void {
        this.logs.unshift({
            date: new Date(),
            title: log
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
    }

    public static getInstance(): LoggerService {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }

        return LoggerService.instance;
    }
}
