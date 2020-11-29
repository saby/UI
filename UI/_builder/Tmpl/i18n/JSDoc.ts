/// <amd-module name="UI/_builder/Tmpl/i18n/JSDoc" />

/**
 * @description Предоставляет интерфейс-обертку для работы с JSDOC описанием классов компонентов.
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/i18n.ts
 */

/**
 * Represents interface for root JSDOC schema.
 */
export interface IJSDocSchema {

   /**
    * Class property.
    */
   [path: string]: IClassSchema;
}

/**
 * Class schema.
 */
export interface IClassSchema {

   /**
    * Full class name.
    */
   name?: string;

   /**
    * Class title.
    */
   title?: string;

   /**
    * Class name.
    */
   className?: string;

   /**
    * Collection of properties.
    */
   properties?: IClassPropertiesSchema;
}

/**
 * Collection of class properties.
 */
export interface IClassPropertiesSchema {
   'ws-config'?: IWsConfigSchema;
   'ws-handlers'?: IWsHandlersSchema;
}

/**
 * Property.
 */
export interface IWsConfigSchema {

   /**
    * Property title.
    */
   title?: string;

   /**
    * Property options.
    */
   options?: IWsConfigOptionsSchema;
}

/**
 * Configurations.
 */
export interface IWsConfigOptionsSchema {

   /**
    * Configuration property.
    */
   [optionName: string]: IWsOptionSchema;
}

/**
 * Option description.
 */
export interface IWsOptionSchema {

   /**
    * Option title.
    */
   title?: string;

   /**
    * Option type.
    */
   type?: string;

   /**
    * Subtype for inner properties.
    */
   itemType?: string;

   /**
    * Subtype for inner elements.
    */
   arrayElementType?: string;

   /**
    * Translatable flag.
    */
   translatable?: boolean;
}

/**
 * Handlers.
 */
export interface IWsHandlersSchema {

   /**
    * Handler title.
    */
   title?: string;

   /**
    * Handler options.
    */
   options: IWsHandlerOptionsSchema;
}

/**
 * Handler options collection.
 */
export interface IWsHandlerOptionsSchema {

   /**
    * Handler option.
    */
   [eventName: string]: IWsHandlerSchema;
}

/**
 * Handler option.
 */
export interface IWsHandlerSchema {

   /**
    * Handler title.
    */
   title?: string;

   /**
    * Handler editor.
    */
   editor?: string;

   /**
    * Handler parameters.
    */
   params?: string;
}

/**
 * Interface for component description.
 */
export interface IComponentDescription {

   /**
    * Check if component property is translatable.
    * @param propertyPath {string} Component property path.
    * @returns {boolean} Returns true in case of translatable property.
    */
   isPropertyTranslatable(propertyPath: string): boolean;
}

/**
 * Interface for JSDOC processor.
 */
export interface IJSDocProcessor {

   /**
    * Get component node description.
    * @param componentPath {string} Component path.
    * @returns {IComponentDescription} Returns component description.
    */
   getComponentDescription(componentPath: string): IComponentDescription;
}

/**
 * Internal interface for component description.
 */
interface IInternalJSDocContract extends IJSDocProcessor {

   /**
    * Get component property description.
    * @param componentPath {string} Component property path.
    * @returns {IComponentDescription} Returns component property description.
    */
   getComponentProperties(componentPath: string): IWsConfigOptionsSchema;
}

/**
 * Component property path separator.
 */
const PROPERTY_PATH_SEPARATOR = '/';

/**
 * Empty object constant.
 */
const EMPTY_OBJECT = { };

/**
 * Represents component description.
 */
class ComponentDescription implements IComponentDescription {

   /**
    * JSDOC processor.
    */
   private readonly jsDocProcessor: IInternalJSDocContract;

   /**
    * Component path.
    */
   private readonly componentPath: string;

   /**
    * Initialize new instance of component description.
    * @param jsDocProcessor {IInternalJSDocContract} JSDOC processor.
    * @param componentPath {string} Component path.
    */
   constructor(jsDocProcessor: IInternalJSDocContract, componentPath: string) {
      this.jsDocProcessor = jsDocProcessor;
      this.componentPath = componentPath;
   }

   /**
    * Check if component property is translatable.
    * @param propertyPath {string} Component property path.
    * @returns {boolean} Returns true in case of translatable property.
    */
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

/**
 * Dummy component description all properties of which are not translatable.
 */
class DummyComponentDescription implements IComponentDescription {

   /**
    * Check if component property is translatable.
    * @param propertyPath {string} Component property path.
    * @returns {boolean} Returns true in case of translatable property.
    */
   isPropertyTranslatable(propertyPath: string): boolean {
      return false;
   }
}

/**
 * Clean component path from plugin prefix.
 * @param componentPath {string} Component path.
 */
function prepareComponentPath(componentPath: string): string {
   return componentPath
      .replace(/^optional!/gi, '')
      .replace(/^js!/gi, '');
}

/**
 * Represents JSDOC processor.
 */
class JSDocProcessor implements IInternalJSDocContract {

   /**
    * JSDOC schema.
    */
   private readonly schema: IJSDocSchema;

   /**
    * Initialize new instance of JSDOC processor.
    * @param schema {IJSDocSchema} JSDOC schema.
    */
   constructor(schema: IJSDocSchema) {
      this.schema = schema;
   }

   /**
    * Get component node description.
    * @param componentPath {string} Component path.
    * @returns {IComponentDescription} Returns component description.
    */
   getComponentDescription(componentPath: string | null): IComponentDescription {
      if (typeof componentPath === 'string') {
         const component = prepareComponentPath(componentPath);
         if (this.schema.hasOwnProperty(component)) {
            return new ComponentDescription(this, component);
         }
      }
      return new DummyComponentDescription();
   }

   /**
    * Get component property description.
    * @param componentPath {string} Component property path.
    * @returns {IComponentDescription} Returns component property description.
    */
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

/**
 * Create JSDOC processor.
 * @param schema {IJSDocSchema} JSDOC schema.
 * @returns {IJSDocProcessor} Returns instance of JSDOC processor.
 */
export default function createJSDocProcessor(schema: IJSDocSchema): IJSDocProcessor {
   return new JSDocProcessor(schema);
}
