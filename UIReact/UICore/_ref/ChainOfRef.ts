import { IResponsibility } from './Responsibility';

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
     * @param node
     */
    public execute(node: HTMLElement): void {
        this.handlers.forEach((handler) => handler.getHandler()(node));
    }

    // TODO: Remove
    public show(): void {
        console.log(this);
    }
}
