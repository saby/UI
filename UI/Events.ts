/**
 * Библиотека событий
 * @library UI/Events
 * @includes EventUtils UI/_events/EventUtils
 * @includes Subscriber UI/_events/Subscriber
 * @public
 * @author Тэн В.А.
 */
import * as Subscriber from './_events/Subscriber';
import * as EventUtils from './_events/EventUtils';
import { FastTouchEndController } from './_events/Mobile/FastTouchEndController';
export { ISyntheticEvent } from './_events/IEvents';

export {
   Subscriber,
   EventUtils,
   FastTouchEndController
}
