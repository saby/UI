// @ts-ignore
import { Control } from 'UI/Base';
// @ts-ignore
import template = require('wml!UI/_hotKeys/Dispatcher');
// @ts-ignore
import { goUpByControlTree } from 'UI/Base';
// @ts-ignore
import { constants } from 'Env/Env';

/**
 * Контрол выделяет область, в которой будут перехватываться клавиши и перенаправляться на обработку дочернему контролу,
 * который зарегистрировал себя на обработку этих клавиш с помощью контрола UI/HotKeys:KeyHook.
 * Облатсь содержимого body также выделена контролом UI/HotKeys:Dispatcher
 */
class Dispatcher extends Control {
   keyDownHandler(event: Event): void {
      const nativeEvent = event.nativeEvent;
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
         const popupIndex = wholeParents.findIndex((parent) => parent._moduleName === 'Controls/_popup/Manager/Popup');
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
         if (!event.target.closest('.richEditor_TinyMCE') && !event.target.closest('.controls-RichEditor')) {
            event.stopPropagation();
         }
      }
   }
}

// @ts-ignore
Dispatcher.prototype._template = template;

export default Dispatcher;
