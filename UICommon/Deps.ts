/// <amd-module name="UICommon/Deps" />

/**
 * Библиотека для работы с зависимостями на странице
 * @library UICommon/Deps
 * @includes addPageDeps UICommon/_deps/PageDependencies
 * @author Мустафин Л.И.
 */

export { addPageDeps } from './_deps/PageDependencies';
export { isModuleExists } from './_deps/PageDeps';

import HeadData, { headDataStore } from './_deps/HeadData';
import { DepsCollector } from './_deps/DepsCollector';

export {
    HeadData,
    headDataStore,
    DepsCollector
};
