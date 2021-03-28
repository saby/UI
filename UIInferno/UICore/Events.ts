/**
 * Библиотека событий
 * @library UICore/Events
 * @includes EventUtils UICore/_events/EventUtils
 * @includes Subscriber UICore/_events/Subscriber
 * @public
 * @author Тэн В.А.
 */
import * as Subscriber from './_events/Subscriber';
import * as EventUtils from './_events/EventUtils';
import { FastTouchEndController } from './_events/Touch/FastTouchEndController';
import { WasabyEvents } from './_events/WasabyEvents';

export { ISyntheticEvent, IWasabyEventSystem } from './_events/IEvents';

export { default as isInvisibleNode } from './_events/InvisibleNodeChecker';

export {
    Subscriber,
    EventUtils,
    FastTouchEndController,
    WasabyEvents
};
