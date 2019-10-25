/// <amd-module name="UI/_base/Start" />

import Control from './Control';
import * as AppEnv from 'Application/Env';
import * as AppInit from 'Application/Initializer';
import startApplication from 'UI/_base/startApplication';

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

function startFunction(config: any, domElement: HTMLElement): void {
    startApplication(config);

    if (typeof window !== 'undefined' && window['receivedStates'] && AppInit.isInit()) {
        // для совместимости версий. чтобы можно было влить контролы и WS одновременно
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
    require([dcomp || undefined, dom.attributes.application.value], (result: any): void => {
        if (result) {
            if (module) {
                result = result[module];
            }
            config = config || {};
            config.application = dom.attributes.application.value;
        }
        config.buildnumber = window.buildnumber;
        createControl(result, config, dom);
    });
}

export default startFunction;
