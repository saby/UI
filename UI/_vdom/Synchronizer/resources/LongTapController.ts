/* tslint:disable */

import { IEventState, IMobileEvent, ILongTapEvent, MobileEvent } from "./MobileEvents";

/**
 * @author Санников К.А.
 */

let longTapState;
let handlerName;

export class LongTapController {
   private static tapTimeout;

   public static resetState(): void {
      clearTimeout(this.tapTimeout);
      longTapState = {
         minTapDuration: 1000
      }
   }

   public static initState(event: IMobileEvent, callbackFn: Function, callbackArgs: [unknown]): IEventState {
      if (MobileEvent.hasEventData(longTapState) || this.resetState()) {
         return;
      }
      handlerName = 'LongTap';
      longTapState = MobileEvent.initEventState(event, longTapState, this, handlerName);
      this.tapTimeout = setTimeout(() => {
         this.detectState(event);
         callbackFn(...callbackArgs);
      }, longTapState.minTapDuration);
      return longTapState;
   }
   private static eventCoordPatch(target: ILongTapEvent, patch: Touch): Event {
      target.clientX = patch.clientX;
      target.clientY = patch.clientY;
      target.pageX = patch.pageX;
      target.pageY = patch.pageY;
      target.screenX = patch.screenX;
      target.screenY = patch.screenY;
      return target;
   }
   private static detectLongTap(event: IMobileEvent): boolean {
      const currentTime = Date.now();
      let isLongTapEvent = false;
      if (event.target === longTapState.target && currentTime - longTapState.time >= longTapState.minTapDuration) {
         isLongTapEvent = true;
      }
      return isLongTapEvent;
   }

   public static detectState(event: IMobileEvent): boolean {
      if (longTapState.target) {
         const isLongTap = this.detectLongTap(event);
         if (isLongTap) {
            // block default action on long tap
            event.stopPropagation && event.stopPropagation();
            let longTap = new Event('longtap') as any;
            longTap = this.eventCoordPatch(longTap, event.touches[0]);
            event.target.dispatchEvent(longTap);
            // prevent swipe event
            MobileEvent.stopInitializedHandler();
         }
         return isLongTap;
      }
   }
}
