/// <amd-module name="UICommon/_executor/_Utils/ChildrenManager" />
/* tslint:disable */

/**
 * @author Тэн В.А.
 */
// @ts-ignore
import { delay } from 'Types/function';

// свойство, которое дает нам понять, что если произошел unmount и сразу mount, значит удаления
// элемента не было и мы можем не удалять элемент из списка
const deletedPropertyName = '__$delete__';

export function onElementMount(child) {
    child[deletedPropertyName] = false;
}

const asyncPurifyTimeout = 1000;
const queue = [];
let isQueueStarted: boolean = false;

function releaseQueue(): void {
   const currentTimestamp: number = Date.now();
   while (queue.length) {
      const [children, childName, timestamp] = queue[0];
      if (currentTimestamp - timestamp < asyncPurifyTimeout) {
         setTimeout(releaseQueue, asyncPurifyTimeout);
         return;
      }
      queue.shift();
      clearChildren(children, childName);
   }
   isQueueStarted = false;
}

function addToQueue(children, childName): void {
   queue.push([children, childName, Date.now()]);
   if (!isQueueStarted) {
      isQueueStarted = true;
      setTimeout(releaseQueue, asyncPurifyTimeout);
   }
}

function clearChildren(children, childName) {
   if (children[childName] && children[childName][deletedPropertyName]) {
      delete children[childName];
   }
}

// Перед удалением детей из списка _children нужно убедится что ref действительно сработал на удаление
// нод. В случае если выполняется событие, оно может попасть в период между unmount и mount элемента
// на самом деле в этот момент элемент из дома не удален - во время работы патча такое может произойти
// с любым элементов VDOM
export function onElementUnmount(children, childName) {
    if (children[childName]) {
       children[childName][deletedPropertyName] = true;
    }

   addToQueue(children, childName);
}
