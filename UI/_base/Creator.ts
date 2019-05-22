//@ts-ignore
import { OptionsResolver } from 'View/Executor/Utils';
import Control from './Control';
//@ts-ignore
import * as Logger from 'View/Logger';
//@ts-ignore
import { Focus, ContextResolver } from 'View/Executor/Expressions';

export default function createControl(ctor: any, cfg: any, domElement: HTMLElement): Control {
    var defaultOpts = OptionsResolver.getDefaultOptions(ctor);
    // @ts-ignore
    OptionsResolver.resolveOptions(ctor, defaultOpts, cfg);
    var attrs = { inheritOptions: {} }, ctr;
    OptionsResolver.resolveInheritOptions(ctor, attrs, cfg, true);
    try {
        ctr = new ctor(cfg);
    } catch (error) {
        ctr = new Control({});
        Logger.catchLifeCircleErrors('constructor', error, ctor.prototype && ctor.prototype._moduleName);
    }
    ctr.saveInheritOptions(attrs.inheritOptions);
    ctr._container = domElement;
    Focus.patchDom(domElement, cfg);
    ctr.saveFullContext(ContextResolver.wrapContext(ctr, { asd: 123 }));
    ctr.mountToDom(ctr._container, cfg, ctor);
    ctr._$createdFromCode = true;
    return ctr;
}

export async function async(ctor: any, cfg: any, domElement: HTMLElement): Promise<Control> {
    return new Promise(function (resolve, reject) {
        try {
            var inst = createControl(ctor, cfg, domElement),
                baseAM = inst._afterMount;

            inst._afterMount = function () {
                baseAM.apply(this, arguments);
                resolve(this);
            };
        } catch (e) {
            reject(e);
        }
    });
}