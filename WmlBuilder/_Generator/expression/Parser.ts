import {IExpressionParser, IScope} from './IExpressionParser';
import {parseStatic} from './data/Static';
import parseDynamic from "./data/Dynamic";
import {IAttrProgramData, INodeType, IPreparedNode, IStaticData} from "../Interfaces";


export class Parser implements IExpressionParser {

   parsers: { [propertyname:string]: (expression:IStaticData|IAttrProgramData) => IPreparedNode} = {};

   constructor() {
      this.parsers[INodeType.text] = parseStatic;
      this.parsers[INodeType.var] = parseDynamic.parseDynamic.bind(parseDynamic);
   }

   parseExpression(expression:IAttrProgramData|IStaticData): Array<IPreparedNode> {
      if (Array.isArray(expression)) {
         return expression.reduce((prev, next)=>{
            prev = prev.concat(this.parseExpression(next));
            return prev;
         }, []);
      }
      return [this.parsers[expression.type](expression)];
   }
}
