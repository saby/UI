import { IResponsibility, IResponsibilityHandler } from './Responsibility';

interface IChainRefResponsibility {
    add(responsibility: IResponsibility): ChainOfRef;
    execute(node: HTMLElement): void;
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
    public add(responsibility: IResponsibility): ChainOfRef {
        this.handlers.push(responsibility);
        return this;
    }

    /**
     * Запуск цепочки обязанностей
     * execute()(node)
     * @param node
     */
    public execute(node: HTMLElement): IResponsibilityHandler {
        return (node: HTMLElement) => this.handlers.forEach((handler) =>  handler.getHandler()(node));
    }
}
