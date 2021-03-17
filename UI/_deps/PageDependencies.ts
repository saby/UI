import { constants } from 'Env/Env';
import { headDataStore } from "UI/Base";
import * as Library from "WasabyLoader/Library";

interface IParsedName {
    name: string;
    path: string[];
}

/**
 * Добавить модуль в зависимости страницы.
 * Метод актуален только на СП.
 * @function
 * @param modules список с названиями модулей, в обычном (Foo/bar) или библиотечном (Foo/bar:baz) синтаксисе
 * @public
 */
export function addPageDeps(modules: string[]): void {
    if (constants.isBrowserPlatform || !modules || !modules.length) {
        return;
    }
    modules.forEach((moduleName) => {
        const parsedInfo: IParsedName = Library.parse(moduleName);
        headDataStore.read('pushDepComponent')(parsedInfo.name);
    });
}
