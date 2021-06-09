import { Responsibility, IResponsibilityHandler } from './Responsibility';

export class CreateOriginRef extends Responsibility {
    private ref: IResponsibilityHandler;

    constructor(ref: string | React.MutableRefObject<unknown> | React.RefCallback<unknown>) {
        super();

        if (typeof ref === 'string') {
            throw new Error('WasabyOverReact не поддерживат Ref в формате строки.');
        }

        if ('current' in ref) {
            this.ref = (node: HTMLElement) => { ref.current = node; };
        } else {
            this.ref = ref;
        }
    }

    getHandler(): IResponsibilityHandler {
        return this.ref;
    }
}
