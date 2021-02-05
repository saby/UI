import { DOMEnvironment } from 'UI/Vdom';
import {IDOMEnvironment} from './interfaces';

const _environments: IDOMEnvironment[] = [];

export function createEnvironment(element: HTMLElement): IDOMEnvironment {

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
