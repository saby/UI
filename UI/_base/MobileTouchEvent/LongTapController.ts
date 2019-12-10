/// <amd-module name="Vdom/_private/Synchronizer/resources/LongTapController" />
/* tslint:disable */

import MobileEventHelper from './MobileEventHelper';

let longTapState;
let handlerName;

export default class LongTapController {
    private static tapTimeout;

    constructor() {
        handlerName = 'LongTap';
    }

    public static resetState() {
        clearTimeout(this.tapTimeout);
        longTapState = {
            minTapDuration: 1000
        }
    }


    public static initState(event) {
        if (MobileEventHelper.hasEventData(longTapState) || this.resetState()) {
            return;
        }
        longTapState = MobileEventHelper.initEventState(event, longTapState, this, handlerName);
        this.tapTimeout = setTimeout(()=>{
            this.detectState(event);
        }, longTapState.minTapDuration);
        return longTapState;
    }

    private static detectLongTap(event) {
        var currentTime = Date.now();
        var longTapEvent = false;
        if (event.target === longTapState.target && currentTime - longTapState.time >= longTapState.minTapDuration) {
            longTapEvent = true;
        }
        return longTapEvent;
    }

    public static detectState(event) {
        if (longTapState.target) {
            var longTapTime = this.detectLongTap(event);
            if (longTapTime) {
                // block default action on long tap
                event.stopPropagation && event.stopPropagation();
                var longTap = new Event('longtap') as any;
                event.target.dispatchEvent(longTap);
                // prevent swipe event
                MobileEventHelper.stopInitializedHandler();
            }
            return longTapTime;
        }
    }

}
