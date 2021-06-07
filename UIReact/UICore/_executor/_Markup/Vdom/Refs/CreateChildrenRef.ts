import { onElementMount, onElementUnmount } from 'UICommon/Executor';
import { Control } from 'UICore/Base';
import { Responsibility, IResponsibilityHandler, } from 'UICore/Ref';

export class CreateChildrenRef extends Responsibility {
    private parent: Control;
    private name: string;

    constructor(parent: Control, name: string) {
        super();
        this.name = name;
        this.parent = parent;

    }
    public getHandler(): IResponsibilityHandler {
        if(!name || !parent) {
            return () => {};
        }
        return (node: HTMLElement) => {
            if (!node) {
                onElementUnmount(this.parent['_children'], this.name);
                return;
            }
            this.parent['_children'][this.name] = node;
            onElementMount(this.parent['_children'][this.name]);
        };
    }
}
