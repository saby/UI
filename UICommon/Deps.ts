/// <amd-module name="UICommon/Deps" />

/**
 * Библиотека для работы с зависимостями на странице
 * @library UICommon/Deps
 * @includes addPageDeps UICommon/_deps/HeadData
 * @author Мустафин Л.И.
 */

export { aggregateCSS, aggregateJS, aggregateDependencies, BASE_DEPS_NAMESPACE,
         TIMETESTER_SCRIPTS_NAMESPACE } from './_deps/DependenciesPlaceholder';
export { isModuleExists } from './_deps/RecursiveWalker';

import HeadData, { headDataStore, addPageDeps } from './_deps/HeadData';
import { DepsCollector } from './_deps/DepsCollector';

export {
    HeadData,
    headDataStore,
    addPageDeps,
    DepsCollector
};
