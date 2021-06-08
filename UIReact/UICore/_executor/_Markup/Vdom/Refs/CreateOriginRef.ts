import { Responsibility, IResponsibilityHandler, } from 'UICore/Ref';

export class CreateOriginRef extends Responsibility {
    private func: IResponsibilityHandler = () => {};

    constructor(handler: IResponsibilityHandler) {
        super();
        this.func = handler;
    }

    public getHandler(): IResponsibilityHandler {
        return this.func;
    }
}
