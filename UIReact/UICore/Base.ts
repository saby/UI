export { default as Control, IControlChildren, IControlConstructor }  from './_base/Control';

import { IGeneratorConfig } from 'UICommon/Executor';

// TODO: реализовать или не использовать.
export function getGeneratorConfig(): IGeneratorConfig {
    throw new Error('В сборке на Реатке нет метода getGeneratorConfig');
}

// TODO: Реализовать или не использовать.
export function startApplication(cfg?: Record<string, unknown>): void {
    throw new Error('В сборке на Реатке нет метода startApplication');
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
export { IErrorConfig, TErrBoundaryOptions } from 'UICore/_base/interfaces';
