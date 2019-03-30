import {IPreparedNode, Methods} from "../_Generator/Interfaces";

export interface BaseCode {
   getFunction: (fnName:Methods, args:any) => string;
   getFunctionWithScope: (fnName:string, scope:string, args:any) => string;
   getValue: (name:string) => string;
   getLink: (name:string) => string;
   getImport: (name:string) => string;

   getObject: (name:string, obj: any) => string;
   joinToString: (arr:Array<any>) => string;
   getGlobalDefine: (constName:string, constValue:string) => string;
   
   getJoinElements: (elements:Array<string>) => string;
   getVarsPart: (elements:Array<string>) => string;

   getFullView: (fnGenName: string, globals:string, elements:string, rootFn: boolean) => string;
   getMemoizeData: (name:string, returnedValue: string, deps: Array<string>, keyPrefix: string) => string;
   getStrFromObj: (obj:any) => string;
   getFile: (moduleName:string, middle:string, deps:Array<string>) => string;

   createTagPresentation: (node:IPreparedNode, tagInfo: string, attr: any, options: any, key_pref: any) => string;
   createTextPresentation: (node:IPreparedNode, tagInfo: string, key_pref: any) => string;
   
}
