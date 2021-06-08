export type IResponsibilityHandler = (node: HTMLElement) => void;

export interface IResponsibility<T = any> {
    find(node: HTMLElement): T;
    getHandler(): IResponsibilityHandler | {
        current: unknown;
    };
}

export abstract class Responsibility implements IResponsibility {
    public find(node: HTMLElement) {
        return node;
    }

    abstract getHandler(): IResponsibilityHandler;
}
