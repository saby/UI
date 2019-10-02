// @ts-ignore
import { OptionsResolver } from 'View/Executor/Utils';
import Control from './Control';
// @ts-ignore
import * as Logger from 'View/Logger';
// @ts-ignore
import { Focus, ContextResolver } from 'View/Executor/Expressions';
import startApplication from 'UI/_base/startApplication';

/**
 * @class UI/_base/Creator
 * @author Шипин А.А.
 * @public
 */

/**
 * Создаёт корневой контрол.
 * @function UI/_base/Creator#createControl
 * @remark
 * При вызове метода инициализируется инфраструктура веб-фреймворка Wasaby.
 * Метод выполняется синхронно.
 * Для асинхронного создания контрола используйте метод
 * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/wasaby/compound-wasaby/#corecreator
 * Core/Creator}.
 */
/**
 * Method for creation a root control.
 * Use this method when you want to create a root control.
 * When you call this method, you create the entire
 * Wasaby infrastructure.
 * For asynchronous item creation you can use
 * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/wasaby/compound-wasaby/#corecreator
 * Core/Creator}.
 */
export default function createControl(ctor: any, cfg: any, domElement: HTMLElement): Control {
   startApplication();
   const defaultOpts = OptionsResolver.getDefaultOptions(ctor);
   // @ts-ignore
   OptionsResolver.resolveOptions(ctor, defaultOpts, cfg);
   const attrs = {
      inheritOptions: {}
   };
   let ctr: any;
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

/**
 * Асинхронно создаёт элемент.
 * @function UI/_base/Creator#async
 * @remark
 * Возвращается promise, который сработает на хуке afterMount().
 */
/**
 * Method for asynchronous item creation.
 */
export async function async(ctor: any, cfg: any, domElement: HTMLElement): Promise<Control> {
    return new Promise((resolve, reject) => {
        try {
            const inst = createControl(ctor, cfg, domElement);
            const baseAM = inst._afterMount;

            // @ts-ignore
            inst._afterMount = function(): void {
                baseAM.apply(this, arguments);
                resolve(this);
            };
        } catch (e) {
            reject(e);
        }
    });
}
