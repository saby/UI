/// <amd-module name="UICommon/Deps" />

/**
 * Библиотека для работы с зависимостями на странице
 * @library UICommon/Deps
 * @includes addPageDeps UICommon/_deps/PageDependencies
 * @author Мустафин Л.И.
 */

export { addPageDeps } from './_deps/PageDependencies';
export { aggregateCSS, aggregateJS, aggregateDependencies, BASE_DEPS_NAMESPACE, TIMETESTER_SCRIPTS_NAMESPACE } from './_deps/DependenciesPlaceholder';
export { default as PrefetchLinksStore, handlePrefetchModules } from './_deps/PrefetchLinks';

import HeadData, { headDataStore } from './_deps/HeadData';
import { DepsCollector } from './_deps/DepsCollector';

export {
    HeadData,
    headDataStore,
    DepsCollector
};
