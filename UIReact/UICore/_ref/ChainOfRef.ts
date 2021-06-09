import { IResponsibility, IResponsibilityHandler } from './Responsibility';

interface IChainRefResponsibility {
    add(responsibility: IResponsibility): ChainOfRef;
    execute(): IResponsibilityHandler;
}

/**
 * Создает и вызывает исполнение цепочки рефов
 */
export class ChainOfRef implements IChainRefResponsibility {
    private handlers: IResponsibility[];

    constructor() {
        this.handlers = [];
    }

    /**
     * Добавление обязанности в цепочку
     * add(IResponsibility)
     * @param responsibility
     * @return ChainOfRef
     */
    add(responsibility: IResponsibility): ChainOfRef {
        this.handlers.push(responsibility);
        return this;
    }

    /**
     * Запуск цепочки обязанностей
     * execute()(node)
     * @return IResponsibilityHandler
     */
    execute(): IResponsibilityHandler {
        return (node: HTMLElement) => this.handlers.forEach((handler) => {
            return handler.getHandler()(node);
        });
    }
}
