/// <amd-module name="UICore/_base/RouteCompatible" />
/**
 * Контрол-обертка для страниц, которые на СП строятся через wml!UI/Route
 * Контрол нужен для того, чтобы можно было прокинуть состояние из СП в браузер и корректно построить
 * совместимые WS3 страницы
 */
import { constants } from 'Env/Env';
import { setConfig } from 'Application/Env';
import { TemplateFunction, IControlOptions } from 'UICommon/Base';
import { default as Control } from './Control';
import template = require('wml!UICore/_base/RouteCompatible');

interface IRouteOptions extends IControlOptions {
    application?: string;
    jsBlock?: string;
    cssBlock?: string;
    jsLinks?: string[];
    cssLinks?: string[];
    modLinks?: string[];
}

export default class RouteCompatible extends Control<IRouteOptions, IRouteOptions> {
    _template: TemplateFunction = template;
    protected data: IRouteOptions;

    _beforeMount(options: IRouteOptions, _: unknown, receivedState: IRouteOptions): Promise<IRouteOptions> | void {
        if (constants.isServerSide) {
            this.data = filterOptions(options);

            // взведем флаг, что перед отдачей браузеру готового html необходимо еще обернуть результать в "новый" html
            // делается это в PresentationService/Render
            setConfig('renderHTMLforOldRoutes', true);

            return Promise.resolve(this.data);
        }

        this.data = receivedState;
    }
}

/**
 * Необходимо отфильтровать опции, которые потом попадут в receivedState.
 * Удалим явно ненужные на клиенте опции и функции.
 * @param options
 */
function filterOptions(options: IRouteOptions): IRouteOptions {
    const restrictedOptions = {jsBlock: null, cssBlock: null, jsLinks: null, cssLinks: null, modLinks: null};
    const newOptions: IRouteOptions = {...options, ...restrictedOptions};
    return Object.keys(newOptions)
        .reduce((obj: IRouteOptions, key) => {
            if (typeof newOptions[key] !== 'function') {
                obj[key] = options[key];
            }
            return obj;
        }, {});
}
