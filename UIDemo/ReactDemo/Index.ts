import { Control, TemplateFunction } from 'UI/Base';
// @ts-ignore
import * as template from 'wml!UIDemo/ReactDemo/Index';
import { AsyncErrorViewer } from 'UIDemo/ReactDemo/ErrorBoundary/AsyncErrorViewer';

export default class Index extends Control {
   protected _template: TemplateFunction = template;
   // @ts-ignore
   protected asyncErrorViewer: AsyncErrorViewer = AsyncErrorViewer;
   protected clickMe() {
      console.log('was clicked');
   }
}
