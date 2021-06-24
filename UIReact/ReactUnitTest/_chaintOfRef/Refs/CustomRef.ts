import { Responsibility, IResponsibilityHandler } from 'UICore/Ref';

export class CustomRef extends Responsibility {
    constructor() {
        super();
    }

    getHandler(): IResponsibilityHandler {
        return (node) => {
            if (typeof(node.count) === 'undefined') {
                node.count = 0;
                return;
            }
            node.count += 1;
            return;
        };
    }
}
