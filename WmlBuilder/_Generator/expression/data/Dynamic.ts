import {
   IAttrProgramData,
   ICallExpressionNode,
   IExpressionStatementNode,
   IProgramNode,
   Methods,
   TypeFunction
} from "../../Interfaces";

//@ts-ignore
import proccess = require('View/Builder/Tmpl/expressions/process');

let unescapedHtmlFunctionName = '__setHTMLUnsafe';

let identifierExpressions = {
   'rk'    : 'thelpers.rk',
   'debug' : 'debug',
   '...'   : 'thelpers.uniteScope(markupGenerator.getScope(data), {parent: undefined, element: undefined})(thelpers.plainMerge)',
   'undefined': 'undefined',
   'null' : 'null'
};

function resolveIdentifier(node, data, forMemberExpression) {
   if (identifierExpressions[node.name]) {
      return identifierExpressions[node.name];
   } else if (data) {
      return {
         fn: Methods.getter,
         type: TypeFunction.data,
         arguments: {
            source: data,
            options: [node.name]
         }
      };
   } else if (forMemberExpression) {
      return 'data';
   } else {
      return {
         fn: Methods.getter,
         type: TypeFunction.data,
         arguments: {
            source: 'data',
            options: [node.name]
         }
      };
   }
}

export default {
   parseDynamic(expression: IAttrProgramData): string {

      //expression.name
      return this.Program(expression.name);

      //return proccess(expression, undefined, {}, '', false, {}, '', false);
   },

   buildArgumentsArray(args, data) {
      return args.map((value) => {
         return this[value.type](value, data);
      });
   },

   Program (pNode: IProgramNode) {
      if (pNode.body.length > 1) {
         throw new Error('Can\'t parse expression. Check your template.');
      }
      return this[pNode.body[0].type](pNode.body[0]);
   },


   ExpressionStatement(statement: IExpressionStatementNode) {
      return this[statement.expression.type](statement.expression);
   },

   CallExpression(node: ICallExpressionNode) {
      let callee = this[node.callee.type](node.callee),
         data = '',
         val;
      if (callee) {
         if (callee === unescapedHtmlFunctionName) {
            //val = processUnescapedHtmlFunction.call(this, node.arguments, data);
         } else if (typeof node.callee['object'] !== 'undefined') {
            let objectExpression = node.callee['object'];
            val = {
               fnToCall: callee,
               scope: this[objectExpression.type](objectExpression),
               arguments: {
                  options: this.buildArgumentsArray(node.arguments, data)
               },
               type: TypeFunction.call

            };
         } else {
            val = {
               fnToCall: callee,
               scope: 'data',
               arguments: {
                  options: this.buildArgumentsArray(node.arguments, data)
               },
               type: TypeFunction.call
            };
         }
         return val;
      }
      throw new Error('Call expression error. Object to call on is "' + node.string + '" equals to ' + callee);
   },

   MemberExpression (node, data) {
      let
         obj = node,
         arr = [],
         res;

      if (obj.property) {
         while (obj.type === 'MemberExpression') {
            arr.unshift(obj.computed ? this[obj.property.type](obj.property) : obj.property.name);
            obj = obj.object;
         }

         let dataSource = '';
         if (obj.type === 'Identifier') {
            dataSource = resolveIdentifier(obj, data, true);
            if (dataSource === 'data') {
               // Значение любого data-идентификатора будет получено из scope'а, поэтому ставим
               // data в качестве источника, а сам идентификтор ставим первым в списке полей
               arr.unshift(obj.name);
            }
         } else {
            // Если источник данных - сложное выражение, его нужно будет вычислять
            dataSource = this[obj.type](obj, data);
         }

         res = {
            fn: Methods.getter,
            type: TypeFunction.data,
            arguments: {
               source: dataSource,
               options: arr
            }
         };
      } else {
         res = this[obj.object.type](obj.object, data);
      }

      return res;
   },

   Identifier(node, data) {
      return resolveIdentifier(node, data, false);
   }


}
