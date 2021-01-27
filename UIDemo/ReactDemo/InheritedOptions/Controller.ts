import { Control, TemplateFunction } from 'UI/Base';

// @ts-ignore
import * as template from 'wml!UIDemo/ReactDemo/InheritedOptions/Controller';

export default class Controller extends Control {
   protected _template: TemplateFunction = template;
   protected _themeName: string = 'testTheme';
   protected _readOnly: boolean = false;

   protected _toggleThemeName(): void {
      this._themeName =
         this._themeName === 'testTheme' ? 'anotherTestTheme' : 'testTheme';
   }

   protected _toggleReadonly(): void {
      this._readOnly = !this._readOnly;
   }
}
