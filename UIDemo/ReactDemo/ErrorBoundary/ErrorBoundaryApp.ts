import { Control } from 'UICore/Base';
import { TemplateFunction } from 'UI/Base';
import * as template from "wml!UIDemo/ReactDemo/ErrorBoundary/ErrorBoundaryApp";
import {IErrorViewer} from 'UICore/_base/interfaces';
import {IWasabyContextValue} from 'UICore/_contexts/WasabyContext';

export default class ErrorBoundaryApp extends Control {
    constructor(props: {errorViewer: IErrorViewer}, context: IWasabyContextValue) {
        super(props, context);
    }
    protected _template: TemplateFunction = template;
}
