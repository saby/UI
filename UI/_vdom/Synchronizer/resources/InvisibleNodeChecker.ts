import { IControlNode } from '../interfaces';

/**
 * @author Кондаков Р.Н.
 */

export const invisibleNodeTypename: string = 'invisible-node';

function isInvisibleType(typename?: string): boolean {
    return typename === invisibleNodeTypename;
}

export default function isInvisibleNode(controlNode: IControlNode, checkChildren: boolean = false): boolean {
    if (!controlNode) {
        return false;
    }
    const markupType = controlNode.markup && controlNode.markup.type;
    const fullMarkupType = controlNode.fullMarkup && controlNode.fullMarkup.type;
    const childControlNode = controlNode.childrenNodes && controlNode.childrenNodes[0];
    return isInvisibleType(markupType) || isInvisibleType(fullMarkupType) ||
        (checkChildren && isInvisibleNode(childControlNode));
}
