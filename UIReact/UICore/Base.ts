export { default as Control, IControlChildren, IControlConstructor }  from './_base/Control';

import { logger } from 'Application/Env';
import { IGeneratorConfig } from 'UICommon/Executor';

export { default as WasabyPortal } from './_base/WasabyPortal';

// TODO: реализовать или не использовать.
export function getGeneratorConfig(): IGeneratorConfig | void {
    logger.error('В сборке на Реатке нет метода getGeneratorConfig');
}

// TODO: Реализовать или не использовать.
export function startApplication(cfg?: Record<string, unknown>): void {
    logger.error('В сборке на Реакте нет метода startApplication');
}

/**
 * Возвращаем ноду, от которой начинаем строить.
 * UIReact строит в переданном контейнере
 * @param node Element
 */
export function selectRenderDomNode(node: HTMLElement): HTMLElement {
    return node;
}
export { ErrorViewer } from './_base/ErrorViewer';
export { IErrorViewer } from './_base/interfaces';
