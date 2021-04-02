import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!UIDemo/ReactDemo/Children/TestControl';

export default class TestControl extends Control {
   protected _template: TemplateFunction = template;
}
