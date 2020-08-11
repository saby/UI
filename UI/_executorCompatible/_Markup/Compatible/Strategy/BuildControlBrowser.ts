/// <amd-module name="UI/_executorCompatible/_Markup/Compatible/Strategy/BuildControlBrowser" />
/* tslint:disable */

import { BuildControl } from './BuildControl';
import { Subscriber } from 'UI/Events';
import { saveContextCompatible } from '../Helper';
import { Logger } from 'UI/Utils';

/**
 * @author Тэн В.А.
 */
// @ts-ignore
export class BuildControlBrowser extends BuildControl {

   subscribeEvents(inst, logicParent, eventsList) {
      Subscriber.subscribeEvents(inst, logicParent, eventsList);
   };

   saveContextFix(options, inst) {
      saveContextCompatible(options, inst);
   };

   checkAsyncResult(result, inst) {
      if (result.then) {
         Logger.error(`Ошибка построения Wasaby-контрола внутри WS3-окружения. _beforeMount Wasaby-контрола вернул Promise. Асинхронные Wasaby-контролы не поддерживаются в WS3-окружении`, inst)
      }
   };

   prepareStateReceiver(key, receivedState) {
      return;
   }
}
