/// <amd-module name="UI/Vdom" />
/* tslint:disable */
import { Options as _Options, TOptions } from 'UICommon/Vdom';

import {
    Synchronizer,
    Debug
} from 'UICore/Vdom';

import { SyntheticEvent } from 'UICommon/Events';

/**
 * Определить, отличаются ли старый и новый наборы опций с учетом контентных опций.
 * Наборы отличаются если произошло обновление (изменилось значение опции), удаление или добавление новой опции.
 * @param newOptions {object} Новый набор опций.
 * @param oldOptions {object} Старый набор опций.
 */
function isOptionsChanged(newOptions: object, oldOptions: object): boolean {
    return !!_Options.getChangedOptions(newOptions as TOptions, oldOptions as TOptions);
}

export {
    isOptionsChanged,
    Synchronizer,
    Debug,
    SyntheticEvent,
    _Options
};
