/// <amd-module name="UI/Deps" />

/**
 * Библиотека для работы с зависимостями на странице
 * @library UI/Deps
 * @includes addPageDeps UI/_deps/PageDependencies
 * @author Мустафин Л.И.
 */

export { addPageDeps } from 'UI/_deps/PageDependencies';
export { aggregateCSS, aggregateJS, aggregateDependencies,
         BASE_DEPS_NAMESPACE } from 'UI/_deps/DependenciesPlaceholder';
export { default as PrefetchLinksStore, handlePrefetchModules } from 'UI/_deps/PrefetchLinks';
export { isModuleExists } from './_deps/PageDeps';

import HeadData, { headDataStore } from './_deps/HeadData';
import { DepsCollector } from './_deps/DepsCollector';

export {
    HeadData,
    headDataStore,
    DepsCollector
};
