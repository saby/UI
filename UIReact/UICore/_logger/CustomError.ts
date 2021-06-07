export class CustomError extends Error {
    constructor(name: string = 'Error', error?: Error) {
        super(error?.stack || '');
        this.name = name + ':';
    }
}
