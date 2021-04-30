/**
 * @author Тэн В.А.
 */

import { IWasabyEventSystem } from "UICommon/Events";

/*
 * Поиск системы событий для WasabyOverReact среди родительских нод
 */
export function findEventSystem(node: HTMLElement & { eventSystem?: IWasabyEventSystem }): IWasabyEventSystem {
   // FIXME https://online.sbis.ru/opendoc.html?guid=1702cde9-2108-4ac6-8095-0566d7a3758c
   if (!node) { return; }
   if (node.eventSystem) {
      return node.eventSystem;
   }
   return findEventSystem(node.parentElement);
}
