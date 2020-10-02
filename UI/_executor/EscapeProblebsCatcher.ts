import { Common } from './Utils';
import { Logger } from 'UI/Utils';
import { Set, Map } from 'Types/shim';

const wrongEscapeList: Map<string, Set<string>> = new Map([
    ['Controls-demo/TestXslt/TestXslt', new Set([
        '_result',
        '_xml',
        '_xsl'])],
    ['Controls/input:Area', new Set([
        '_tooltip',
        '_viewModel.displayValue',
        'value'])],
    ['Controls/list:ListView', new Set([
        'itemData.item.country'])],
    ['RichEditor/base:Editor', new Set([
        'displayValue'])],
    ['UI/Base:Control', new Set([
        '_model.displayValue',
        'value'])]
]);

export default function catchEscapeProblems(value, viewController, pathName): void {
    if (typeof value !== 'string' || typeof document === 'undefined' || !viewController?._template || value === Common.unescape(value)) {
        return;
    }
    const moduleName = viewController._moduleName;
    let pathlist: Set<string> = wrongEscapeList.get(moduleName);
    if (!pathlist) {
        pathlist = new Set();
        wrongEscapeList.set(moduleName, pathlist);
    }
    if (!pathlist.has(pathName)) {
        // TODO message
        Logger.error('В контроле ' + moduleName + ' что-то не так с эскейпом в ' + pathName);
        pathlist.add(pathName);
    }
}