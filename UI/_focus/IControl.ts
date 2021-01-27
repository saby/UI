import { IDOMEnvironment } from './Events';

export interface IControl {
   activate: Function;
   _getEnvironment(): IDOMEnvironment;
}
