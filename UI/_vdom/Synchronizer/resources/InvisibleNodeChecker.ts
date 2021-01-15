import { IControlNode } from '../interfaces';
import { invisibleNodeTagName } from 'UI/Executor';

/**
 * @author Санников К.А.
 */

function isInvisibleType(typename?: string): boolean {
    return typename === invisibleNodeTagName;
}

export default function isInvisibleNode(controlNode: IControlNode, checkChildren: boolean = false): boolean {
    if (!controlNode) {
        return false;
    }
    const markupType = controlNode.markup && controlNode.markup.type;
    const fullMarkupType = controlNode.fullMarkup && controlNode.fullMarkup.type;
    const childControlNode = controlNode.childrenNodes && controlNode.childrenNodes[0];
    return isInvisibleType(markupType) || isInvisibleType(fullMarkupType) ||
        (checkChildren && isInvisibleNode(childControlNode, checkChildren));
}
