import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!UIDemo/ReactDemo/Children/Index';

export default class Index extends Control {
   protected _template: TemplateFunction = template;
   protected _children: {
      element: Element;
      control: Control;
      partialElement: Element;
      partialControl: Control;
   };

   protected _afterMount(): void {
      this.assertChildType('element', Element);
      this.assertChildType('control', Control);
      this.assertChildType('partialElement', Element);
      this.assertChildType('partialControl', Control);
   }

   private assertChildType(name: keyof Index['_children'], type: Function): void {
      if (!(this._children[name] instanceof type)) {
         throw new Error(`Ребёнок ${name} должен быть типа ${type}`);
      }
   }
}
