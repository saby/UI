import { Control } from 'UICore/Base';
import { TemplateFunction } from 'UI/Base';
import * as template from "wml!UIDemo/ReactDemo/ErrorBoundary/ErrorBoundaryApp";

export default class ErrorBoundaryApp extends Control {
    protected _template: TemplateFunction = template;
}
