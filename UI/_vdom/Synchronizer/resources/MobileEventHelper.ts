interface IEventHandlerObject {
   [key: string]: IHandlerFunction;
}
interface IHandlerFunction extends Function {
   resetState: Function;
}
export interface ICoordinates {
   x: number;
   y: number;
}

export interface IExtendEvent extends Event {
   touches: [MouseEvent];
   clientX?: number;
   clientY?: number;
}

export interface ITouchState {
   minSwipeDistance: number;
   deviationThreshold: number;
   maxSwipeDuration: number;
   time: number;
   location: ICoordinates;
   target: EventTarget;
}

export class MobileEventHelper {
   private static initEventHandlers: IEventHandlerObject = {};

   static getTouchLocation(event: IExtendEvent): ICoordinates {
      const data = event.touches ? event.touches[0] : event ;
      return {
         x: data.clientX,
         y: data.clientY
      };
   }

   static hasEventData(eventState: Event): EventTarget {
      return eventState && eventState.target;
   }

   static initEventState(event: IExtendEvent,
                         eventState: ITouchState,
                         initHandler: IHandlerFunction,
                         handlerName: string): ITouchState {
      if (handlerName && initHandler) {
         // collect information about event
         this.initEventHandlers[handlerName] = initHandler;
      }
      eventState.time = Date.now();
      eventState.location = this.getTouchLocation(event);
      eventState.target = event.target;
      return eventState;
   }

   /// Обработка события
   static stopInitializedHandler(): void {
      for (let reset = 0; reset < Object.keys(this.initEventHandlers).length; reset++) {
         this.initEventHandlers[reset].resetState();
      }
   }
}
