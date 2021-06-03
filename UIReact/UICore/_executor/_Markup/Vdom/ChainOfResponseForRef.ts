type IResponsibilityHandler = (node: HTMLElement) => void;

interface IResponsibility<T = any> {
    find(node: HTMLElement): T;
    getHandler(): IResponsibilityHandler;
}

interface IChainRefResponsibility {
    add(responsibility: IResponsibility): void;
    getHandler(node: HTMLElement): () => void;
}
