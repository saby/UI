import * as AppEnv from 'Application/Env';

class AppData {
   RUMEnabled: Boolean = false;
   buildnumber: string = '';
   appRoot: string = '';
   staticDomains: string = '[]';
   wsRoot: string = '';
   resourceRoot: string = '';
   servicesPath: string = '';
   application: string = '';
   product: string = '';
   pageName: string = '';
   // tslint:disable-next-line:no-any
   cssBundles: any = null;

   // tslint:disable-next-line:no-any
   constructor(cfg: any) {
      this.appRoot = cfg.appRoot;
      this.application = cfg.application;
      this.wsRoot = cfg.wsRoot;
      this.resourceRoot = cfg.resourceRoot;
      this.RUMEnabled = cfg.RUMEnabled;
      this.pageName = cfg.pageName;
      this.product = cfg.product;
      this.cssBundles = cfg.cssBundles;
      this.buildnumber = cfg.buildnumber;
      this.servicesPath = cfg.servicesPath;
      this.staticDomains = cfg.staticDomains;
   }
   registerConsumer(): void {
      // Need this to pass AppData as context field
   }
   // tslint:disable-next-line:no-any
   unregisterConsumer(control: any): void {
      // Need this to pass AppData as context field
   }
   updateConsumers(): void {
      // Need this to pass AppData as context field
   }
   // tslint:disable-next-line:no-any
   static initAppData(cfg: any): void {
      // tslint:disable-next-line:ban-ts-ignore
      // @ts-ignore
      AppEnv.setStore('AppData', new AppData(cfg));
   }
   static getAppData(): AppData {
      // tslint:disable-next-line:ban-ts-ignore
      // @ts-ignore
      return AppEnv.getStore('AppData');
   }
}
export default AppData;
