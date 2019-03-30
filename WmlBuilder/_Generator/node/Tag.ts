import {IAstNode, IPreparedNode, ITypeAstNode, Methods, TypeFunction} from '../Interfaces';
import { Node } from './Node';
import { Control } from './Tag/Control';
import { Dom } from './Tag/Dom';
import { isWasabyTag } from '../tag/name';


export class Tag extends Node {
   
   private isTagControlNode(node: IAstNode):boolean {
      const children = node.children;
      return isWasabyTag(node.name) || children && children[0] &&
         (children[0].type === ITypeAstNode.control || children[0].type === ITypeAstNode.template);
   }

   private tagExtention: Node;
   constructor(node: IAstNode) {
      super(node);
      if (this.isTagControlNode(node)) {
         this.tagExtention = new Control(node);
      } else {
         this.tagExtention = new Dom(node);
      }
   }

   getFunctionName():Methods {
      return Methods.createTag;
   }

   getChildren():Array<IAstNode> {
      return this.tagExtention.getChildren();
   }

   getInjectedData():Array<IAstNode> {
      return this.tagExtention.getInjectedData();
   }

   setPreparedChildren(nodes:Array<IPreparedNode>):void {
      this.tagExtention.setPreparedChildren(nodes);
   }

   setPreparedInjectedData(nodes:Array<IPreparedNode>):void {
      this.tagExtention.setPreparedInjectedData(nodes);
   }

   cookAttributes():void {
      this.tagExtention.cookAttributes();
   }
   
   getAttributes():{[propertyname:string]:Array<IPreparedNode>} {
       return this.tagExtention.attributes;
   }

   getOptions():{[propertyname:string]:Array<IPreparedNode>} {
       return this.tagExtention.options;
   }

   getResult():IPreparedNode {
        return {
            name: this.node.name,
            fn: this.getFunctionName(),
            type: TypeFunction.child,
            exportedOptions: this.exportedOptions,
            exportedAttributes: this.exportedAttributes,
            arguments: {
                options: this.getOptions(),
                attributes: this.getAttributes()
            }
        }
    }

   

 /* 
  convertHashMapToArray( obj:{[propertyname:string]:any} ):Array<IPreparedNode> {
      let result = [];
      for(var i in obj) {
         if (obj.hasOwnProperty(i)) {
            result.push({
               name: i,
               type: TypeFunction.object,
               value: obj[i].data
            })
         }
      }
      return result;
   }

 prepareInjectedData(node: IAstNode): IPreparedNode {
      if (isWasabyTag(node.name)) {
         let attribs = this.extractOptions(node, node.attribs, []);

         return {
            name: node.name,
            type: TypeFunction.object,
            value: this.convertHashMapToArray(attribs),
            children: node.children
         }
      }
      return null;
   }*/
}
