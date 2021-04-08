/**
 * @author Тэн В.А.
 */

import { IWasabyEventSystem } from "UICommon/Events";

/*
 * Поиск системы событий для WasabyOverReact среди родительских нод
 */
export function findEventSystem(node: HTMLElement& { eventSystem?: IWasabyEventSystem }): IWasabyEventSystem {
   if (node.eventSystem) {
      return node.eventSystem;
   }
   return findEventSystem(node.parentElement);
}
