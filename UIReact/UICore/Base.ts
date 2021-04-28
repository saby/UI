export { default as Control}  from './_base/Control';

export { TemplateFunction } from './_base/interfaces';

import { IGeneratorConfig } from 'UICommon/Executor';

// TODO: реализовать или не использовать.
export function getGeneratorConfig(): IGeneratorConfig {
    throw new Error('В сборке на Реатке нет метода getGeneratorConfig');
}

// TODO: Реализовать или не использовать.
export function startApplication(cfg?: Record<string, unknown>): void {
    throw new Error('В сборке на Реатке нет метода startApplication');
}
