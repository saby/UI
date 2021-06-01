interface IHandler {
    /**
     * Метод устанавливает приемника
     */
    setNext(handler: IHandler): IHandler;

    handler(node: Element): void;
}

abstract class AbstractChainOfResponse implements IHandler {
    private nextHandler: IHandler;

    public setNext(handler: IHandler): IHandler {
        this.nextHandler = handler;
        return handler;
    }

    public handler(node: Element): void {
        if (this.nextHandler) {
            return this.nextHandler.handler(node);
        }
        return null;
    }
}

class GetContainer extends AbstractChainOfResponse {
    public handler(node: Element): void {
        if (!node) {
            throw new Error('В ref() не передали элемент, получить контейнер невозможно!');
        }
        return super.handler(node);
    }
}

class CreateControlNode extends AbstractChainOfResponse {
    public handler(node: Element): void {
        // const controlNode = ControlNodes.prepareControlNode();
        // надо сделать prepareControlNode не void, чтобы в случае ошибки цепочка прервалась
        // if (!controlNode) {
        //     throw new Error('ControlNode не был создан!');
        // }
        return super.handler(node);
    }
}

class SetEventHooks extends  AbstractChainOfResponse {
    public handler(node: Element): void {

        super.handler(node);
    }
}

class SetChildren extends  AbstractChainOfResponse {
    public handler(node: Element): void {

        super.handler(node);
    }
}

export {
    GetContainer,
    CreateControlNode,
    SetEventHooks,
    SetChildren
}
