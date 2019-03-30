import {IPreparedNode} from "../Interfaces";
import {BaseCode} from "../../Implementations/BaseCode";

function getOrParse(el: IPreparedNode, codeFactory: BaseCode) {
   if (typeof el === 'object') {
      return entity[el.type](el, codeFactory);
   }
   return el;
}

function prepareArgs(options:Array<IPreparedNode>, codeFactory: BaseCode):Array<string> {
   return options.map((el)=>{
      return getOrParse(el, codeFactory);
   });
}

const entity = {
   data: (node:IPreparedNode, codeFactory: BaseCode):string => {
      return codeFactory.getFunction(node.fn,
         { source: getOrParse(node.arguments.source, codeFactory),
            options: prepareArgs(node.arguments.options, codeFactory)
         });
   },
   link: (node:IPreparedNode, codeFactory: BaseCode):string => {
      return codeFactory.getLink(node.name);
   },
   importLink: (node:IPreparedNode, codeFactory: BaseCode):string => {
      return codeFactory.getLink(node.name);
   },
   call: (node:IPreparedNode, codeFactory: BaseCode):string => {
      return codeFactory.getFunctionWithScope(entity[node.scope.type](node.scope, codeFactory),
         getOrParse(node.fnToCall, codeFactory), {options: prepareArgs(node.arguments.options, codeFactory)});
   },
   value: (node:IPreparedNode, codeFactory: BaseCode):string => {
      return codeFactory.getValue(node.name);
   },
   text: (node:IPreparedNode, codeFactory: BaseCode):string => {
      //TODO:: WTF!&&
      return codeFactory.getValue(node.name);
   },
   object: (node:IPreparedNode, codeFactory: BaseCode):string => {
      return codeFactory.getObject(node.name, getOrParse(node.value, codeFactory));
   },
   import: (node:IPreparedNode, codeFactory: BaseCode):string => {
      return codeFactory.getImport(node.name);
   }
};


function findImportLink(node:IPreparedNode, codeFactory: BaseCode):string {
   if (node.arguments &&
      node.arguments.options &&
      node.arguments.options.__specialOptionForControl) {
      let resolvedTagName = node.arguments.options.__specialOptionForControl[0];
      return convertPreparedNode(resolvedTagName, codeFactory);
   }
   return `"${node.name}"`;
}

const functionsCreator = {
   'createText': (node:IPreparedNode, attributes: string, options: string, keyPrefix: string, codeFactory: BaseCode) => {
      let value = codeFactory.joinToString( node.value.map((el)=>{
               return convertPreparedNode(el, codeFactory);
      }) );
      return codeFactory.createTextPresentation(node, value, keyPrefix);
   },
   'createTag': (node:IPreparedNode, attributes: string, options: string, keyPrefix: string, codeFactory: BaseCode) => {
      return codeFactory.createTagPresentation(node, findImportLink(node, codeFactory), attributes, options, keyPrefix)
   }
};

export function convertPreparedNode(node:IPreparedNode, codeFactory: BaseCode):string {
   return entity[node.type](node, codeFactory);
}

export function createChildFunction(node:IPreparedNode, attributes: string, options: string, keyPrefix: string, codeFactory: BaseCode):string {
   return functionsCreator[node.fn](node, attributes, options, keyPrefix, codeFactory);
}