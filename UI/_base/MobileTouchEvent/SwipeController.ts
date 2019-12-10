/// <amd-module name="Vdom/_private/Synchronizer/resources/SwipeController" />
/* tslint:disable */

import MobileEventHelper from './MobileEventHelper';

let swipeState;
let handlerName;

export default class SwipeController {

   constructor() {
      handlerName = 'Swipe';
   }

   public static resetState() {
      swipeState = {
         minSwipeDistance: 50,
         deviationThreshold: 25,
         maxSwipeDuration: 600
      };
   }


   public static initState(event) {
      var location = MobileEventHelper.getTouchLocation(event);
      if (MobileEventHelper.hasEventData(swipeState) || this.resetState() || !this.isSwipe(location)) {
         return;
      }
      swipeState = MobileEventHelper.initEventState(event, swipeState, this, handlerName);
   }

   private static isSwipe(location) {
      /// Данная проверка необходима, чтобы не слать событие swipe, когда пользователь переходит по истории страниц
      /// вперед/назад свайпом - на это событие реагирует браузер. Отличительная черта такого события - swipe начинается
      /// на границах экрана по X.
      return (
          location.x - swipeState.deviationThreshold >= 0 &&
          location.x + swipeState.deviationThreshold <= window.innerWidth
      );
   }

   private static detectSwipe(event) {
      var currentTime = Date.now();
      var location = MobileEventHelper.getTouchLocation(event);
      var direction;
      if (event.target === swipeState.target && swipeState.time - currentTime < swipeState.maxSwipeDuration) {
         if (
             Math.abs(swipeState.location.x - location.x) > swipeState.minSwipeDistance &&
             Math.abs(swipeState.location.y - location.y) < swipeState.deviationThreshold
         ) {
            direction = swipeState.location.x > location.x ? 'left' : 'right';
         } else if (
             Math.abs(swipeState.location.y - location.y) > swipeState.minSwipeDistance &&
             Math.abs(swipeState.location.x - location.x) < swipeState.deviationThreshold
         ) {
            direction = swipeState.location.y > location.y ? 'top' : 'bottom';
         }
      }
      return direction;
   }

   public static detectState(event) {
      if (swipeState.target) {
         var swipeDirection = this.detectSwipe(event);
         if (swipeDirection) {
            var swipe = new Event('swipe') as any;
            swipe.direction = swipeDirection;
            event.target.dispatchEvent(swipe);
            this.resetState();
         }
      }
   }
}
