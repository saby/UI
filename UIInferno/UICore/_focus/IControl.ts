export interface IControl {
   activate: Function;
   isDestroyed?: Function;
   _destroyed?: boolean;
   _getEnvironment: Function;
   _template: Function;
   _container: HTMLElement;
   getContainer?: Function;
   _mounted?: boolean;
   __$focusing?: boolean;
}
