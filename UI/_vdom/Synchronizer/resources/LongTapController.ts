import { MobileEventHelper, IExtendEvent, ITouchState } from './MobileEventHelper';

let longTapState;
let handlerName;

export class LongTapController {
   private static tapTimeout: NodeJS.Timer;

   private static detectLongTap(event: Event): boolean {
      const currentTime = Date.now();
      let longTapEvent = false;
      if (event.target === longTapState.target && currentTime - longTapState.time >= longTapState.minTapDuration) {
         longTapEvent = true;
      }
      return longTapEvent;
   }

   static resetState(): void {
      clearTimeout(this.tapTimeout);
      longTapState = {
         minTapDuration: 1000
      };
   }

   static initState(event: IExtendEvent): ITouchState {
      if (MobileEventHelper.hasEventData(longTapState) || this.resetState()) {
         return;
      }
      handlerName = 'LongTap';
      longTapState = MobileEventHelper.initEventState(event, longTapState, this, handlerName);
      this.tapTimeout = setTimeout(() => {
         this.detectState(event);
      }, longTapState.minTapDuration);
      return longTapState;
   }

   static detectState(event: Event): boolean {
      if (longTapState.target) {
         const longTapTime = this.detectLongTap(event);
         if (longTapTime) {
            // block default action on long tap
            event.stopPropagation();
            const longTap = new Event('longtap');
            event.target.dispatchEvent(longTap);
            // prevent swipe event
            MobileEventHelper.stopInitializedHandler();
         }
         return longTapTime;
      }
   }
}
