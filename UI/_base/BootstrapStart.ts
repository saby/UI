/// <amd-module name="UI/_base/Start" />
/**
 * Модуль для создания корневого контрола и его оживления
 * @author Мустафин Л.И.
 */

import * as AppEnv from 'Application/Env';
import * as AppInit from 'Application/Initializer';
import { loadAsync } from 'WasabyLoader/ModulesLoader';
import { Control } from 'UICore/Base';
import { TControlConstructor } from 'UICommon/interfaces';

export interface ICreateControlOptions {
    application?: string;
    buildnumber?: string;
    bootstrapKey?: string;
}

/**
 * Подготовка StateReceiver.
 * Создание корневого контрола и оживление приложения.
 * @param config
 * @param domElement
 */
export default function startFunction(config: ICreateControlOptions = {}, domElement: HTMLElement): void {
    config = config || {};
    if (typeof window !== 'undefined' && window['receivedStates'] && AppInit.isInit()) {
        AppEnv.getStateReceiver().deserialize(window['receivedStates']);
    }

    // @ts-ignore
    let moduleName = domElement.attributes.application;
    if (moduleName) {
        moduleName = moduleName.value;
    }
    loadAsync(moduleName).then((module: TControlConstructor): void => {
        config.application = moduleName;
        config.buildnumber = window['buildnumber'];
        const dom: HTMLElement = (domElement.firstElementChild || domElement.firstChild) as HTMLElement;
        // @ts-ignore
        config.bootstrapKey = dom.attributes.key.value;
        createControl(module, config, dom);
    });
}

/**
 * Создание|оживление корневого контрола.
 * @param control
 * @param config
 * @param dom
 */
function createControl(control: TControlConstructor, config: ICreateControlOptions, dom: HTMLElement): void {
    let configReady: ICreateControlOptions = config || {};
    if (typeof window !== 'undefined' && window['wsConfig']) {
        configReady = {...configReady, ...window['wsConfig']};
    }

    // region TODO что это за метод _getChildContext ?
    // _getChildContext - таким образом задается контекст контрола, который прокидывается детям автоматически.
    // чтобы у всех дочерних контролов был доступ к контексту заданному родителем. это старая технология,
    // пытались от нее избавиться, сейчас есть белый список разрешенных полей контекста
    // вызывается в UI\_contexts\ContextResolver.ts:wrapContext(...)
    const _getChildContext = control.prototype._getChildContext;
    control.prototype._getChildContext = function(): object {
        const base = _getChildContext ? _getChildContext.call(this) : {};
        if (typeof window !== 'undefined' && window['startContextData']) {
            for (const i in window['startContextData']) {
                if (window['startContextData'].hasOwnProperty(i) && !base.hasOwnProperty(i)) {
                    base[i] = window['startContextData'][i];
                }
            }
        }
        return base;
    };
    // endregion

    Control.createControl(control, configReady, dom);
}

