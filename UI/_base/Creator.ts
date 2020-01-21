import Control from './Control';

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
export default Control.createControl;

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
    // @ts-ignore
    return new Promise((resolve, reject) => {
        try {
            const inst = Control.createControl(ctor, cfg, domElement);
           // @ts-ignore
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
