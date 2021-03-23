import Control from 'UICore/Base';

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
 * Для асинхронного создания контрола используйте метод {@link async}.
 * @see async
 */
/**
 * Method for creation a root control.
 * Use this method when you want to create a root control.
 * When you call this method, you create the entire
 * Wasaby infrastructure.
 * For asynchronous item creation you can use
 * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/asynchronous-control-building/
 * UI/Base:AsyncCreator}.
 */
export default Control.createControl;

/**
 * Асинхронно создаёт элемент.
 * @function UI/_base/Creator#async
 * @remark
 * Возвращается promise, который сработает на хуке afterMount().
 * @see createControl
 */
// tslint:disable-next-line:no-any
export async function async(ctor: any, cfg: any, domElement: HTMLElement): Promise<Control> {
    // tslint:disable-next-line:ban-ts-ignore
    // @ts-ignore
    return new Promise((resolve, reject) => {
        try {
            const inst = Control.createControl(ctor, cfg, domElement);
            // tslint:disable-next-line:ban-ts-ignore
           // @ts-ignore
            const baseAM = inst._afterMount;

            // tslint:disable-next-line:ban-ts-ignore
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
