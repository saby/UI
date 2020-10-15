/* tslint:disable */

import { IEventState, IMobileEvent, MobileEvent } from "./MobileEvents";

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

   public static initState(event: IMobileEvent): IEventState {
      if (MobileEvent.hasEventData(longTapState) || this.resetState()) {
         return;
      }
      handlerName = 'LongTap';
      longTapState = MobileEvent.initEventState(event, longTapState, this, handlerName);
      this.tapTimeout = setTimeout(() => {
         this.detectState(event);
      }, longTapState.minTapDuration);
      return longTapState;
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
            const longTap = new Event('longtap') as any;
            event.target.dispatchEvent(longTap);
            // prevent swipe event
            MobileEvent.stopInitializedHandler();
         }
         return isLongTap;
      }
   }

}
