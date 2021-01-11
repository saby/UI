
function getNumberId(id: string | 0): number {
    return parseInt((id + '').replace('inst_', ''), 10);
}
function sortedAddControlNode(controlNodes: any[], newControlNode: any): void {
    const newId: number = getNumberId(newControlNode.id);

    // Если массив пустой или все айди не меньше, чем у новой ноды - добавляем в конец.
    let newIndex: number = controlNodes.length;
    for (let index = 0; index < controlNodes.length; ++index) {
        const id = getNumberId(controlNodes[index].id);

        // Добавляем ноду перед первой из тех, чей айди меньше.
        if (id < newId) {
            newIndex = index;
            break;
        }
    }
    controlNodes.splice(newIndex, 0, newControlNode);
}
export function addControlNode(controlNodes: any[], controlNode: any): void {
    const controlNodeIdx = controlNodes.indexOf(controlNode);
    const haveNode = controlNodeIdx !== -1;
    if (!haveNode) {
        sortedAddControlNode(controlNodes, controlNode);
    }
}
export function removeControlNode(controlNodes: any[], controlToRemove: any): void {
    if (!controlNodes) {
        return;
    }
    const foundControlNode = controlNodes.find((controlNode) => {
        return controlNode.control === controlToRemove;
    });
    if (foundControlNode) {
        controlNodes.splice(controlNodes.indexOf(foundControlNode), 1);
    }
}
