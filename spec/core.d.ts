declare type HashMap<T> = {
    [propName: string]: T
};

// Сломает переходы в IDE по ctrl+click
declare module "json!*" {
    const json: object;
    export = json;
}
declare module "tmpl!*" {
    const tmpl: (...args: Array<any>) => string;
    export = tmpl;
}
/*declare module "wml!*" {
    const tmpl: (...args: Array<any>) => string;
    export = tmpl;
}*/

declare const process: any;

declare module "Core/Control" {
   class Control {
       public _options: any;
       constructor(cfg:any);
       _notify(...args): any;
      _beforeUpdate(...args): any;
      _forceUpdate(...args): any;

   }
   export = Control;
}

declare let rk: (key: string, ctx?: string | number, num?: number) => string;
