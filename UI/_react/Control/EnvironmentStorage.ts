import {IDOMEnvironment} from './interfaces';

const _environments: IDOMEnvironment[] = [];
let DOMEnvironment;

export function createEnvironment(element: HTMLElement): IDOMEnvironment {
   DOMEnvironment = DOMEnvironment || requirejs('UI/Vdom').DOMEnvironment;

   let environment: IDOMEnvironment;
   const foundEnvironment = _environments.find((env) => {
      //@ts-ignore
      return env instanceof DOMEnvironment && env.getDOMNode() === mountPoint;
   });
   if (foundEnvironment) {
      environment = foundEnvironment;
   } else {
      environment = new DOMEnvironment(element, () => {
         // nothing
      });
      _environments.push(environment);
   }

   return environment;
}
