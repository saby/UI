/// <amd-module name="UI/_builder/Tmpl/i18n/JSDoc" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/i18n.ts
 * @todo In development...
 */

export interface IJSDocSchema {
   [path: string]: IClassSchema;
}

export interface IClassSchema {
   name?: string;
   title?: string;
   className?: string;
   properties?: IClassPropertiesSchema;
}

export interface IClassPropertiesSchema {
   'ws-config'?: IWsConfigSchema;
   'ws-handlers'?: IWsHandlersSchema;
}

export interface IWsConfigSchema {
   title?: string;
   options?: IWsConfigOptionsSchema;
}

export interface IWsConfigOptionsSchema {
   [optionName: string]: IWsOptionSchema;
}

export interface IWsOptionSchema {
   title?: string;
   type?: string;
   itemType?: string;
   arrayElementType?: string;
   translatable?: boolean;
}

export interface IWsHandlersSchema {
   title?: string;
   options: IWsHandlerOptionsSchema;
}

export interface IWsHandlerOptionsSchema {
   [eventName: string]: IWsHandlerSchema;
}

export interface IWsHandlerSchema {
   title?: string;
   editor?: string;
   params?: string;
}

export interface IComponentDescription {
   isPropertyTranslatable(componentPath: string): boolean;
}

export interface IJSDocProcessor {
   getComponentDescription(componentPath: string): IComponentDescription;
}

interface IInternalJSDocContract extends IJSDocProcessor {
   getComponentProperties(componentPath: string): IWsConfigOptionsSchema;
}

class ComponentDescription implements IComponentDescription {
   private readonly jsDocProcessor: IInternalJSDocContract;
   private readonly componentPath: string;

   constructor(jsDocProcessor: IInternalJSDocContract, componentPath: string) {
      this.jsDocProcessor = jsDocProcessor;
      this.componentPath = componentPath;
   }

   isPropertyTranslatable(name: string): boolean {
      const options = this.jsDocProcessor.getComponentProperties(this.componentPath);
      if (!options[name]) {
         return false;
      }
      if (options[name].translatable) {
         return true;
      }
      // TODO: !!!
      return false;
   }
}

class DummyComponentDescription implements IComponentDescription {
   isPropertyTranslatable(name: string): boolean {
      return false;
   }
}

class JSDocProcessor implements IInternalJSDocContract {
   private readonly schema: IJSDocSchema;

   constructor(schema: IJSDocSchema) {
      this.schema = schema;
   }

   getComponentDescription(componentPath: string): IComponentDescription {
      if (this.schema.hasOwnProperty(componentPath)) {
         return new ComponentDescription(this, componentPath);
      }
      return new DummyComponentDescription();
   }

   getComponentProperties(componentPath: string): IWsConfigOptionsSchema {
      const None = { };
      if (!this.schema[componentPath]) {
         return None;
      }
      if (!this.schema[componentPath].properties) {
         return None;
      }
      if (!this.schema[componentPath].properties["ws-config"]) {
         return None;
      }
      if (!this.schema[componentPath].properties["ws-config"].options) {
         return None;
      }
      return this.schema[componentPath].properties["ws-config"].options;
   }
}

export default function createJSDocProcessor(schema: IJSDocSchema): IJSDocProcessor {
   return new JSDocProcessor(schema);
}
