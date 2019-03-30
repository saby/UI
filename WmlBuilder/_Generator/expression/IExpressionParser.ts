import {
   IAttrProgramData, IPreparedNode,
   IStaticData
} from '../Interfaces';

// Object with base and prepared expressions
interface IOneExpression {
   [propertyname: string]: string;
}

export interface IScope {
   area: string;  //name of root scope object. For example "content"
                  //Expression "content.some" can mean that it's injectedData's expression
                  //and this expression isn't checkable from parent function
   expressions: Array<IOneExpression>;
}

export interface IExpressionParser {
   parseExpression(expression:IAttrProgramData|IStaticData): Array<IPreparedNode>;
}
