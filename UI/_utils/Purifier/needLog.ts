/**
 * @author Кондаков Р.Н.
 */

import { Set } from 'Types/shim';

const isNotProduction: boolean = isTestDomain();

/**
 * Отвечает на вопрос, нужно ли отслеживать обращения к полям после очистки.
 * @function UI/_utils/Purifier#needLog
 * @returns { boolean }
 */
export default function needLog(): boolean {
    return isNotProduction;
}

/**
 * Отвечает на вопрос, можно ли очистить модуль синхронно.
 * @function UI/_utils/Purifier#canPurifyInstanceSync
 * @param { string } instanceName имя модуля.
 * @returns { boolean }
 */
export function canPurifyInstanceSync(instanceName: string): boolean {
    let indexOfColon: number = instanceName.indexOf(':');
    const libName = indexOfColon === -1 ? instanceName : instanceName.substr(0, indexOfColon);
    return isLibAllowed(libName);
}

// Возможно, это должно быть где-то отдельно.
function isTestDomain(): boolean {
    const testPrefixes = [
       'wi.sbis.ru',
       'platform-',
       'dev-',
       'test-',
       'localhost',
       '127.0.0.1',
       'fix-',
       'dev.',
       'test.',
       'fix.',
       'rc-',
       'rc.'
    ];
    const hasTestPreffixRegExp = new RegExp(testPrefixes.join('|'));

    const location = typeof window === 'object' && window.location;

    return !!location && (hasTestPreffixRegExp.test(location.host) || !!location.port);
}

// На данный момент - все из wasaby-controls, кроме явно использующих поля после уничтожения.
const libsAllowlistSync: Set<string> = new Set([
    'Controls/breadcrumbs',
    'Controls/browser',
    'Controls/columns',
    'Controls/compatiblePopup',
    'Controls/Constants',
    'Controls/context',
    'Controls/dataSource',
    'Controls/datePopup',
    'Controls/decorator',
    'Controls/deprecatedFilter',
    'Controls/deprecatedSearch',
    'Controls/display',
    'Controls/dragnDrop',
    'Controls/dropdownPopup',
    'Controls/editableArea',
    'Controls/editInPlace',
    'Controls/error',
    'Controls/explorer',
    'Controls/explorers',
    'Controls/filter',
    'Controls/filterPopup',
    'Controls/grid',
    'Controls/heading',
    'Controls/history',
    'Controls/input',
    'Controls/interface',
    'Controls/itemActions',
    'Controls/jumpingLabel',
    'Controls/listDragNDrop',
    'Controls/listRender',
    'Controls/listTemplates',
    'Controls/lookup',
    'Controls/lookupPopup',
    'Controls/marker',
    'Controls/masterDetail',
    'Controls/MoveDialog',
    'Controls/moverDialog',
    'Controls/multiselection',
    'Controls/operations',
    'Controls/operationsPanel',
    'Controls/operationsPopup',
    'Controls/paging',
    'Controls/popupConfirmation',
    'Controls/popupTemplate',
    'Controls/progress',
    'Controls/propertyGrid',
    'Controls/search',
    'Controls/shortDatePicker',
    'Controls/slider',
    'Controls/source',
    'Controls/spoiler',
    'Controls/Store',
    'Controls/suggest',
    'Controls/switchableArea',
    'Controls/tabs',
    'Controls/tile',
    'Controls/toggle',
    'Controls/toolbars',
    'Controls/tree'
]);

function isLibAllowed(libName: string): boolean {
    return libsAllowlistSync.has(libName);
}
