import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/LifecycleDemo/AllHooks');

export default class AllHooks extends Control {
   protected _template: TemplateFunction = template;

   protected _beforeMountCalled: boolean = false;
   protected _componentDidMountCalled: boolean = false;
   protected _afterMountCalled: boolean = false;
   protected _beforeUpdateCalled: boolean = false;
   protected _componentDidUpdateCalled: boolean = false;
   protected _afterUpdateCalled: boolean = false;

   protected _beforePaintCalled: boolean = false;
   protected _afterRenderCalled: boolean = false;

   protected _beforeMount(): void {
      this._beforeMountCalled = true;
   }

   protected _componentDidMount(): void {
      this._componentDidMountCalled = true;
   }

   protected _afterMount(): void {
      this._afterMountCalled = true;
   }

   protected _beforeUpdate(): void {
      this._beforeUpdateCalled = true;
   }

   protected _componentDidUpdate(): void {
      this._componentDidUpdateCalled = true;
   }

   protected _afterUpdate(): void {
      this._afterUpdateCalled = true;
   }

   protected _beforePaint(): void {
      this._beforePaintCalled = true;
   }

   protected _afterRender(): void {
      this._afterRenderCalled = true;
   }

   _forceUpdateHandler(): void {
      this._beforeMountCalled = false;
      this._componentDidMountCalled = false;
      this._afterMountCalled = false;
      this._beforeUpdateCalled = false;
      this._componentDidUpdateCalled = false;
      this._afterUpdateCalled = false;
      this._beforePaintCalled = false;
      this._afterRenderCalled = false;
   }
}
