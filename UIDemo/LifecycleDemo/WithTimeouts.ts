import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/LifecycleDemo/WithTimeouts');

export default class WithTimeouts extends Control {
   protected _template: TemplateFunction = template;

   protected _componentDidMountCalled: boolean = false;
   protected _afterMountCalled: boolean = false;
   protected _afterRenderCalled: boolean = false;
   protected _afterUpdateCalled: boolean = false;

   protected _componentDidMount(): void {
      this._componentDidMountCalled = true;
   }

   protected _afterMount(): void {
      setTimeout(() => {
         this._afterMountCalled = true;
      }, 1000);
   }

   protected _afterRender(): void {
      this._afterRenderCalled = true;
   }

   protected _afterUpdate(): void {
      setTimeout(() => {
         this._afterUpdateCalled = true;
      }, 1000);
   }

   _forceUpdateHandler(): void {
      this._componentDidMountCalled = false;
      this._afterMountCalled = false;
      this._afterRenderCalled = false;
      this._afterUpdateCalled = false;
   }
}
