import {IResponsibilityHandler, Responsibility} from './Responsibility';

export class OriginResponsibility extends Responsibility {
    private func: IResponsibilityHandler = () => {};

    constructor(handler: IResponsibilityHandler) {
        super();
        this.func = handler;
    }

    public getHandler(): IResponsibilityHandler {
        return this.func;
    }
}
