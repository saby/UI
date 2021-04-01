/// <amd-module name="UI/_base/Start" />

import { Control } from 'UICore/Base';
import * as AppEnv from 'Application/Env';
import * as AppInit from 'Application/Initializer';
import { startApplication } from 'UICore/Base';

/**
 * @author Санников К.А.
 */

// tslint:disable-next-line:no-any
function createControl(control: any, config: any, dom: any): void {
    const configReady = config || {};
    if (typeof window && window.wsConfig) {
        for (const i in window.wsConfig) {
            if (window.wsConfig.hasOwnProperty(i)) {
                configReady[i] = window.wsConfig[i];
            }
        }
    }
    const _getChildContext = control.prototype._getChildContext;
    // tslint:disable-next-line:no-any
    control.prototype._getChildContext = function(): any {
        const base = _getChildContext ? _getChildContext.call(this) : {};
        if (typeof window && window.startContextData) {
            for (const i in window.startContextData) {
                if (window.startContextData.hasOwnProperty(i) && !base.hasOwnProperty(i)) {
                    base[i] = window.startContextData[i];
                }
            }
        }
        return base;
    };
    Control.createControl(control, configReady, dom);
}

// tslint:disable-next-line:no-any
function startFunction(config: any, domElement: HTMLElement): void {
    startApplication(config);
    // tslint:disable-next-line:no-string-literal
    if (typeof window !== 'undefined' && window['receivedStates'] && AppInit.isInit()) {
        // для совместимости версий. чтобы можно было влить контролы и WS одновременно
        // tslint:disable-next-line:no-string-literal
        AppEnv.getStateReceiver().deserialize(window['receivedStates']);
    }

    const dom = domElement || document.getElementById('root');
    let dcomp = dom.attributes.rootapp;
    if (dcomp) {
        dcomp = dcomp.value;
    }
    let module = '';

    if (dcomp && dcomp.indexOf(':') > -1) {
        dcomp = dcomp.split(':');
        module = dcomp[1];
        dcomp = dcomp[0];
    }
    // tslint:disable-next-line:no-any
    requirejs([dcomp || undefined, dom.attributes.application.value], (result: any): void => {
        if (result) {
            if (module) {
                // tslint:disable-next-line:no-parameter-reassignment
                result = result[module];
            }
            // tslint:disable-next-line:no-parameter-reassignment
            config = config || {};
            config.application = dom.attributes.application.value;
        }
        // tslint:disable-next-line:ban-ts-ignore
        // @ts-ignore
        config.buildnumber = window.buildnumber;
        createControl(result, config, dom);
    });
}

export default startFunction;
