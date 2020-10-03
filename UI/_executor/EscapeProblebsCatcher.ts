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

let escapeProblemError: Error;

function getEscapeProblemError(): Error {
    if (!escapeProblemError) {
        escapeProblemError = new Error('Скоро будет исправлена старая ошибка, и это исправление может изменить отображение html-кодов в строковых переменных. ' +
            'Обратитесь к Кондакову Роману, чтобы устранить причину или добавить данный случай в исключения');
    }
    return escapeProblemError;
}

export default function catchEscapeProblems(value, viewController, pathName): void {
    if (
        typeof value !== 'string' ||
        typeof document === 'undefined' ||
        !viewController?._template ||
        value === Common.unescape(value)
     ) {
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
        Logger.error('Обнаружено использование html-кода в переменной модуля ' + moduleName + ' по пути ' + pathName, '', getEscapeProblemError());
        pathlist.add(pathName);
    }
}