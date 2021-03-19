import { IEventState, IMobileEvent, ITouchLocation, MobileEvent } from "./MobileEvents";

let swipeState;
let handlerName;

export class SwipeController {

    public static resetState(): void {
        swipeState = {
            minSwipeDistance: 50,
            deviationThreshold: 25,
            maxSwipeDuration: 600
        };
    }


    public static initState(event: IMobileEvent): IEventState {
        var location = MobileEvent.getTouchLocation(event);
        if (MobileEvent.hasEventData(swipeState) || this.resetState() || !this.isSwipe(location)) {
            return;
        }
        handlerName = 'Swipe';
        swipeState = MobileEvent.initEventState(event, swipeState, this, handlerName);
    }

    private static isSwipe(location: ITouchLocation): boolean {
        /// Данная проверка необходима, чтобы не слать событие swipe, когда пользователь переходит по истории страниц
        /// вперед/назад свайпом - на это событие реагирует браузер. Отличительная черта такого события - swipe начинается
        /// на границах экрана по X.
        return (
            location.x - swipeState.deviationThreshold >= 0 &&
            location.x + swipeState.deviationThreshold <= window.innerWidth
        );
    }

    private static detectSwipe(event: IMobileEvent): string {
        const currentTime = Date.now();
        const location = MobileEvent.getTouchLocation(event);
        let direction;
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

    public static detectState(event: IMobileEvent): void {
        if (swipeState.target) {
            const swipeDirection = this.detectSwipe(event);
            if (swipeDirection) {
                const swipe = new Event('swipe') as any;
                swipe.direction = swipeDirection;
                event.target.dispatchEvent(swipe);
                this.resetState();
            }
        }
    }
}
