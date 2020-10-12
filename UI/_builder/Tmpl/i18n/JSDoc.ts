/// <amd-module name="UI/_builder/Tmpl/i18n/JSDoc" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/i18n.ts
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
   isPropertyTranslatable(propertyPath: string): boolean;
}

export interface IJSDocProcessor {
   getComponentDescription(componentPath: string): IComponentDescription;
}

interface IInternalJSDocContract extends IJSDocProcessor {
   getComponentProperties(componentPath: string): IWsConfigOptionsSchema;
}

const PROPERTY_PATH_SEPARATOR = '/';

const EMPTY_OBJECT = { };

class ComponentDescription implements IComponentDescription {
   private readonly jsDocProcessor: IInternalJSDocContract;
   private readonly componentPath: string;

   constructor(jsDocProcessor: IInternalJSDocContract, componentPath: string) {
      this.jsDocProcessor = jsDocProcessor;
      this.componentPath = componentPath;
   }

   isPropertyTranslatable(propertyPath: string): boolean {
      const path = propertyPath.split(PROPERTY_PATH_SEPARATOR);
      let componentPath = this.componentPath;
      for (let index = 0; index < path.length; ++index) {
         const propertyName = path[index];
         const properties = this.jsDocProcessor.getComponentProperties(componentPath);
         const property = properties[propertyName];
         if (!property) {
            break;
         }
         if (property.translatable) {
            return true;
         }
         const typedefName = property.itemType || property.arrayElementType;
         if (typeof typedefName !== 'string') {
            break;
         }
         componentPath = typedefName;
      }
      return false;
   }
}

class DummyComponentDescription implements IComponentDescription {
   isPropertyTranslatable(name: string): boolean {
      return false;
   }
}

/**
 * @todo Release better check
 * @param componentPath
 */
function prepareComponentPath(componentPath: string): string {
   return componentPath
      .replace(/^optional!/gi, '')
      .replace(/^js!/gi, '');
}

class JSDocProcessor implements IInternalJSDocContract {
   private readonly schema: IJSDocSchema;

   constructor(schema: IJSDocSchema) {
      this.schema = schema;
   }

   getComponentDescription(componentPath: string | null): IComponentDescription {
      if (typeof componentPath === 'string') {
         const component = prepareComponentPath(componentPath);
         if (this.schema.hasOwnProperty(component)) {
            return new ComponentDescription(this, component);
         }
      }
      return new DummyComponentDescription();
   }

   getComponentProperties(componentPath: string): IWsConfigOptionsSchema {
      if (!this.schema[componentPath]) {
         return EMPTY_OBJECT;
      }
      if (!this.schema[componentPath].properties) {
         return EMPTY_OBJECT;
      }
      if (!this.schema[componentPath].properties["ws-config"]) {
         return EMPTY_OBJECT;
      }
      if (!this.schema[componentPath].properties["ws-config"].options) {
         return EMPTY_OBJECT;
      }
      return this.schema[componentPath].properties["ws-config"].options;
   }
}

export default function createJSDocProcessor(schema: IJSDocSchema): IJSDocProcessor {
   return new JSDocProcessor(schema);
}
