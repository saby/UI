import {IAstNode, IPreparedNode, ITypeAstNode, Methods, TypeFunction} from '../Interfaces';
import {INodeGenerator} from './INodeGenerator';
import {isWasabyTag, isAttr} from '../tag/name';
import {Parser} from "../expression/Parser";


export class Module implements INodeGenerator {
   private isTagControlNode(node: IAstNode):boolean {
      const children = node.children;
      return children && children[0] &&
         (children[0].type === ITypeAstNode.control || children[0].type === ITypeAstNode.template);
   }

   expressionsParser:Parser = new Parser();

   getFunctionName(node) {
      return Methods.createControl;
   }

   getChildren(node) {
      return [];
   }

   getInjectedData(node) {
      return node.injectedData;
   }



   getAttributes(node, preparedInjectedData, preparedChildrenNodes, scopes) {
      let finalAttributes = {};
      for (let i in node.attribs) {
         if (node.attribs.hasOwnProperty(i)
         && typeof node.attribs[i] === 'object') {
            //we have odd attribute '_wstemplatename'
            let value = this.expressionsParser.parseExpression(node.attribs[i].data, scopes);
            finalAttributes[i] = value;
         }
      }
      if (isWasabyTag(node.name)) {
         preparedInjectedData.forEach((oneData)=> {
            let option = oneData.name;
            if (isWasabyTag(option)) {
               let optionName = option.replace('ws:', '');
               if (finalAttributes[optionName]) {
                  throw new Error('Option with name '+ optionName + ' is already exist');
               }
               finalAttributes[optionName] = oneData.value;
            } else {
               if (!finalAttributes['content']) {
                  finalAttributes['content'] = [];
               }
               finalAttributes['content'].push(oneData);
            }

         });
      }
      return finalAttributes;
   }

   extractOptions(node, tagAttributes, preparedChildrenNodes) {
      if (isWasabyTag(node.name)) {
         let options = {};
         for(let option in tagAttributes) {
            if (tagAttributes.hasOwnProperty(option)) {
               if (!isAttr(option)) {
                  options[option] = tagAttributes[option];
                  delete tagAttributes[option];
               }
            }
         }
         return options;
      }
      return {
         content: preparedChildrenNodes
      };
   }

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
   }
}
