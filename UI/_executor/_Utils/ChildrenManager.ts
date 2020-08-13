/// <amd-module name="UI/_executor/_Utils/ChildrenManager" />
/* tslint:disable */
// @ts-ignore
import { delay } from 'Types/function';

// свойство, которое дает нам понять, что если произошел unmount и сразу mount, значит удаления
// элемента не было и мы можем не удалять элемент из списка
const deletedPropertyName = '__$delete__';

export function onElementMount(child) {
    child[deletedPropertyName] = false;
}

// Перед удалением детей из списка _children нужно убедится что ref действительно сработал на удаление
// нод. В случае если выполняется событие, оно может попасть в период между unmount и mount элемента
// на самом деле в этот момент элемент из дома не удален - во время работы патча такое может произойти
// с любым элементов VDOM
export function onElementUnmount(children, childName) {
    if (children[childName]) {
       children[childName][deletedPropertyName] = true;
    }
    delay(function () {
        if (children[childName] && children[childName][deletedPropertyName]) {
           delete children[childName];
        }
     });
}
