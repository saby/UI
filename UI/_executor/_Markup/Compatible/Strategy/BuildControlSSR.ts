/// <amd-module name="UI/_executor/_Markup/Compatible/Strategy/BuildControlSSR" />
/* tslint:disable */

import { BuildControl } from './BuildControl';
import * as AppEnv from 'Application/Env';

/**
 * @author Тэн В.А.
 */
// @ts-ignore
export class BuildControlSSR extends BuildControl {

   subscribeEvents(inst, logicParent, eventsList) {
      return;
   };

   saveContextFix(options, inst) {
      return;
   };

   checkAsyncResult(result, inst) {
      return;
   };

   prepareStateReceiver(key, receivedState) {
      let sr = AppEnv.getStateReceiver();
      sr && sr.register(key, {
         getState: function () {
            return receivedState;
         },
         setState: function () {
         }
      });
   }
}
