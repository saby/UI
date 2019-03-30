import {BaseCode} from "../Implementations/BaseCode";

export enum INodeType {
   text = 'text',
   var = 'var',
   Program = 'Program'
}

export enum IBodyType {
   ExpressionStatement ='ExpressionStatement',
   CallExpression = 'CallExpression',
   Identifier = 'Identifier'
}

export interface IIdentifierNode {
   name: string;
   string: string;
   type: IBodyType;
}

export interface ICallExpressionNode {
   string: string;
   type: IBodyType;
   arguments: Array<ICallExpressionNode|IIdentifierNode|IMemberExpressionNode>;
   callee: ICallExpressionNode|IIdentifierNode|IMemberExpressionNode;
}

export interface IMemberExpressionNode {
   computed: boolean;
   string: string;
   object: IMemberExpressionNode|IIdentifierNode|ICallExpressionNode;
   property: IBodyType;
   type: IBodyType;
}

export interface IExpressionStatementNode {
   string: string;
   type: IBodyType;
   expression: ICallExpressionNode|IIdentifierNode|IMemberExpressionNode;
}

export interface IProgramNode {
   string: string; //it's expression
   type: INodeType;
   body: Array<IExpressionStatementNode>;
}

export interface IStaticData {
   type: INodeType;
   value: string;
}

export interface IAttrProgramData {
   localized: boolean;
   name: IProgramNode;
   type: INodeType;
   value: undefined;
}

export interface IAttribute {
   data: IStaticData|IAttrProgramData;
   key?: string;
   property?: boolean; //means that attribute is bind or on
   type: INodeType;
}

export interface IAttrHash {
   [propertyname: string]: IAttribute;
}

export enum ITypeAstNode {
   tag = 'tag',
   text = 'text',
   control = 'control',
   template = 'template',
   module = 'module'
}


export interface IAstNode {
   data?: IStaticData|Array<IProgramNode|IStaticData>;
   key: string;
   type: ITypeAstNode;

   /*For tag node:*/
   attribs?: IAttrHash;
   children?: Array<IAstNode>;
   name?: string;
   selfclosing?: boolean;

   /*if children[0].type === control*/
   injectedData?: Array<IAstNode>;

   /*if type === control*/
   constructor?: string;
   fn?: string;
   optional?: boolean;
}

export interface IConfigImplementation {
   /*calucators, iterators, moduleMaxNameLength aren't using during building process*/
   //mustBeDots: Array<string>; legacy

   ignored: Array<string>; // ignored nodes
   reservedWords: Array<string>; //list of words which we can't use in WML template

}

export interface IConfig {
   config: IConfigImplementation;
   fileName: string;
}

export enum Methods {
   createTag = 'createTag',
   createControl = 'createControl',
   getter = 'getter',
   createText = 'createText'
}

export enum TypeFunction {
   child = 'child',
   object = 'object',
   data = 'data',
   call = 'call',
   value = 'value',
   link = 'link',
   importLink = 'importLink',
   import = 'import'
}

export interface IPreparedNode {
   name: string,
   type: TypeFunction,

   //for type=child
   fn?: Methods,
   scope?: IPreparedNode,
   arguments?: {
      options: {[propertyname:string]:Array<IPreparedNode>},
      source?: any,
      attributes?: {[propertyname:string]:Array<IPreparedNode>}
   },

   //for type=object
   value?: Array<IPreparedNode>;
   children?: Array<IAstNode>;

   //for type=call
   fnToCall?: IPreparedNode;

   //for exported
   exportedOptions?: Array<IPreparedNode>;
   exportedAttributes?: Array<IPreparedNode>;
   globals?: Array<{[propertyname:string]:IPreparedNode}>;
}

export interface IBuilder {

   getFunction: (ast:Array<IAstNode>, config: IConfig, codeFactory: BaseCode) => string;

   reduceAst: (ast:Array<IAstNode>) => Array<IPreparedNode>;
   generateFromOneAstNode: (node:IAstNode) =>  IPreparedNode;
   reduceInjectedData: (injectedData:Array<IAstNode>) => Array<IPreparedNode>;
   generateFromInjectedData: (node: IAstNode) => IPreparedNode;

   generateFunctionFromOption: (data:Array<IPreparedNode>, config: IConfig, codeFactory: BaseCode) => {type:number, name?: string, data: ICodeDefinition};

   
   generateGlobalsDefines: (node:IPreparedNode, name:string, codeFactory: BaseCode) => string;
   getFunctionName: () => string;
   getNameForImport: (module:string) => string;
   getFile: (moduleName:string, middle:string, deps:Array<string>, codeFactory: BaseCode) => string;
   getFunctionFromReducedAst: (fnName: string, reduced:Array<IPreparedNode>, config: IConfig, codeFactory: BaseCode) => ICodeDefinition;
   convertOptionsToExecutionString: (options: {[propertyname:string]:Array<IPreparedNode>}, canBeMemo: boolean, config: IConfig, codeFactory: BaseCode) => {vars:Array<string>, options: {[propertyname:string]:string}};
   convertAttributesToExecutionString: (attributes: {[propertyname:string]:Array<IPreparedNode>}, codeFactory: BaseCode) => {[propertyname:string]:string};
   transformObjectWithMemoize: (dataForGenerating:{[propertyname:string]:string}, 
      baseName: string, 
      canBeMemo: boolean, 
      canBeIndepends: boolean,
      exportedOptions: Array<IPreparedNode>, 
      codeFactory: BaseCode) => {name: string, globals:Array<string>};

}



export interface ICodeDefinition {
   returned: string;
   vars: string;
   fullText: string;
}