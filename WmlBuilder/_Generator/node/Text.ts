import {IAstNode, Methods, IPreparedNode, TypeFunction} from '../Interfaces';
import {Parser} from "../expression/Parser";
import {Node} from "./Node";

export class Text extends Node {

   expressionsParser:Parser = new Parser();
   private getContentArray(node: IAstNode):any {
      if (!node.data) {
         return [];
      }
      if (Array.isArray(node.data)) {
         return node.data;
      }
      return [node.data];
   }

   constructor(node:IAstNode) {
      super(node);
      let data = this.getContentArray(node);
      let textContent:Array<IPreparedNode> = data.reduce((prev, expression) => {
         let data = this.expressionsParser.parseExpression(expression);
         if (Array.isArray(data)) {
             prev = prev.concat(data);
         } else {
             prev.push(data);
         }
         return prev;
     }, []);
     this.saveOption('content', textContent);
   }

   getFunctionName(): Methods {
      return Methods.createText;
   }
   getChildren() {
      return [];
   }
   getInjectedData() {
      return [];
   }
   setPreparedChildren() {
      //do nothing
   }
   setPreparedInjectedData() {
      //do nothing
   }
   cookAttributes() {
      //do nothing
   } 
   
   getResult():IPreparedNode {
      return {
        name: '',
        fn: this.getFunctionName(),
        type: TypeFunction.value,
        value: this.options.content,
        exportedOptions: this.exportedOptions,
        exportedAttributes: this.exportedAttributes
      }
   }
}