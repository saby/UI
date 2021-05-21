/// <amd-module name="UI/Deps" />

/**
 * Библиотека для работы с зависимостями на странице
 * @library UI/Deps
 * @includes addPageDeps UICommon/Deps
 * @author Мустафин Л.И.
 */

export {
    addPageDeps,
    aggregateCSS,
    aggregateJS,
    aggregateDependencies,
    BASE_DEPS_NAMESPACE,
    PrefetchLinksStore,
    handlePrefetchModules,
    HeadData,
    headDataStore,
    DepsCollector
} from 'UICommon/Deps';
