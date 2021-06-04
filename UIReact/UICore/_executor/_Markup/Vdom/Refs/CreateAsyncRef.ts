import { Control } from 'UICore/Base';
import { Responsibility, IResponsibilityHandler, } from 'UICore/Ref';

export class CreateAsyncRef extends Responsibility {
    private parent: Control;

    constructor(parent: Control) {
        super();
        this.parent = parent;

    }
    public getHandler(): IResponsibilityHandler {
        if (!parent) {
            return () => {};
        }
        return (control) => {
            if (!control) {
                return;
            }
            const afterMountPromise = new Promise((resolve) => {
                control._$afterMountResolve.push(resolve);
            });
            this.parent._$childrenPromises?.push(afterMountPromise);
        };
    }
}
