import { Responsibility, IResponsibilityHandler } from './Responsibility';

function noop(): void {
    /* empty */
}

export class CreateOriginRef extends Responsibility {
    private ref: IResponsibilityHandler;

    constructor(ref?: string | React.MutableRefObject<unknown> | React.RefCallback<unknown>) {
        super();

        if (typeof ref === 'string') {
            throw new Error('WasabyOverReact не поддерживат Ref в формате строки.');
        }

        /**
         * Если контентная опция зовётся из чистого реакта, то у неё вообще не будет рефа.
         * Чтобы не ломать цепочку, будет в таком случае добавлять пустую функцию вместо рефа.
         */
        if (!ref) {
            this.ref = noop;
        } else if ('current' in ref) {
            this.ref = (node: HTMLElement) => { ref.current = node; };
        } else {
            this.ref = ref;
        }
    }

    getHandler(): IResponsibilityHandler {
        return this.ref;
    }
}
