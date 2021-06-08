import { IResponsibility, IResponsibilityHandler } from './Responsibility';
import { OriginResponsibility } from './OriginResponsibility';

interface IChainRefResponsibility {
    add(responsibility: IResponsibility): ChainOfRef;
    execute(): IResponsibilityHandler;
    addHandler(handler: IResponsibilityHandler): ChainOfRef;
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
     * Добавление цепочки обязанностей в цепочку
     * addHandler(IResponsibility)
     * @param handler
     * @return ChainOfRef
     */
    public addHandler(handler: IResponsibilityHandler): ChainOfRef {
        const originRef = new OriginResponsibility(handler);
        return this.add(originRef);
    }

    /**
     * Запуск цепочки обязанностей
     * execute()(node)
     * @return IResponsibilityHandler
     */
    public execute(): IResponsibilityHandler {
        return (node: HTMLElement) => this.handlers.forEach((handler) => {
            const realHandler = handler.getHandler();
            if (typeof realHandler === 'function') {
                realHandler(node);
            } else {
                realHandler.current = node;
            }
        });
    }
}
