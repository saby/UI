/// <amd-module name="UI/Utils" />

/**
 * Библиотека служебных утилит для работы с UI Wasaby
 * @library UI/Utils
 * @includes Logger UI/_utils/Logger
 * @includes Purifier UI/_utils/Purifier
 * @includes HotKeysDispatcher UI/_utils/HotKeys
 * @includes goUpByControlTree UI/_utils/goUpByControlTree
 */

import * as Logger from './_utils/Logger';
import * as Purifier from './_utils/Purifier';
import { keyDownHandler as dispatcherHandler, ISyntheticEvent } from './_utils/HotKeys';
import { default as goUpByControlTree }  from './_utils/goUpByControlTree';

export {
    Logger,
    Purifier,
    dispatcherHandler,
    ISyntheticEvent,
    goUpByControlTree
};
