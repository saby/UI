import { Control } from 'UICore/Base';
import { TemplateFunction } from 'UI/Base';
import * as template from "wml!UIDemo/ReactDemo/ErrorBoundary/ErrorBoundaryApp";

export default class ErrorBoundaryApp extends Control {
    // tslint:disable-next-line:no-any
    constructor(props: {errorViewer: any}, context: any) {
        super(props, context);
    }
    protected _template: TemplateFunction = template;
}
