import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!ReactUnitTest/_async/TestControlAsync');

class ExportControl extends Control {
    protected _template: TemplateFunction = template;
}

function exportFunction(echo: string): string { return echo; }
function exportSyncFunction(echo: string): string { return echo; }

export {
    exportFunction,
    exportSyncFunction,
    ExportControl
};
