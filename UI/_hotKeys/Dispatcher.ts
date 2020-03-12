import {Control} from 'UI/Base';
import {goUpByControlTree} from 'UI/Focus';
import {constants} from 'Env/Env';
import template = require('wml!UI/_hotKeys/Dispatcher');

/**
 * Контрол выделяет область, в которой будут перехватываться клавиши и перенаправляться на обработку дочернему контролу,
 * который зарегистрировал себя на обработку этих клавиш с помощью контрола UI/HotKeys:KeyHook.
 * Облатсь содержимого body также выделена контролом UI/HotKeys:Dispatcher
 */
class Dispatcher extends Control {
   keyDownHandler(event: Event): void {
      const nativeEvent = event.nativeEvent;
      if(nativeEvent.handledByDispatcher) {
         // TODO https://online.sbis.ru/opendoc.html?guid=0de5f15f-70eb-40da-b3f0-8b99d4eb1c85
         // It's probably not the right way to fix a problem.
         // We shouldn't handle event if it was already handled by Dispatcher
         return;
      }
      nativeEvent.handledByDispatcher = true;
      const key = 'which' in nativeEvent ? nativeEvent.which : nativeEvent.keyCode;

      // клавиша таб не может быть клавишей по умолчанию, у нее есть конкретное предназначение - переход по табу
      if (key === constants.key.tab) {
         return;
      }

      let needStop = false;
      // если isTrusted = false, значит это мы запустили событие по горячим клавишам,
      // его не надо повторно обрабатывать
      if (event.nativeEvent.isTrusted) {
         // ищем только в пределах попапа
         // todo придумать проверку получше https://online.sbis.ru/opendoc.html?guid=50215de6-da5c-44bf-b6f6-a9f7cb0e17d2
         const wholeParents = goUpByControlTree(nativeEvent.target);
         const findIndexFunction = (parent) => {
            return (parent._keysWeHandle && key in parent._keysWeHandle) || parent._moduleName === 'Controls/_popup/Manager/Popup';
         };
         const popupIndex = wholeParents.findIndex(findIndexFunction);
         const parents = popupIndex === -1 ? wholeParents : wholeParents.slice(0, popupIndex + 1);

         for (let i = 0; i < parents.length; i++) {
            const parent = parents[i];
            if (parent._$defaultActions && parent._$defaultActions[key]) {
               parent._$defaultActions[key].action();
               needStop = true;
               break;
            }
         }
      }

      // если диспетчер нашел зарегистрированное действие на сочетание клавиш и запустил обработчик,
      // клавиши считаются обработанными и больше не должны всплывтаь
      if (needStop) {
         // Так как наша система событий ловит события на стадии capture,
         // а подписки в БТРе на стадии bubbling, то не нужно звать stopPropagation
         // так как обработчики БТРа в таком случае не отработают, потому что
         // у события не будет bubbling фазы
         // TODO: Нужно поправить после исправления
         // https://online.sbis.ru/opendoc.html?guid=cefa8cd9-6a81-47cf-b642-068f9b3898b7
         const target = (event.target as HTMLElement);
         if (!target.closest('.richEditor_TinyMCE') && !target.closest('.controls-RichEditor')) {
            event.stopPropagation();
         }
      }
   }
}

// @ts-ignore
Dispatcher.prototype._template = template;

export default Dispatcher;
