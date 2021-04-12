import { Control } from 'UICore/Base';
import { IOptions } from 'UICommon/Vdom';
import { IRootAttrs } from 'UICommon/interfaces';

// TODO: удалить экспорт после замены всех использований.
export const Synchronizer = {
    mountControlToDOM(
        control: Control,
        options: IOptions,
        mountPoint: HTMLElement,
        attributes: IRootAttrs
    ): void {
        throw new Error('В сборке на Реакте нет метода mountControlToDOM, нужно использовать createControl');
    },
    unMountControlFromDOM(control: Control, element: HTMLElement | HTMLElement[]): void {
        throw new Error('В сборке на Реакте нет метода unMountControlFromDOM, нужно реализовать в другом месте');
    }
};
