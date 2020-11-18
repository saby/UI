import * as AppEnv from 'Application/Env';

class AppData {
   public RUMEnabled: Boolean = false;
   public buildnumber: string = '';
   public appRoot: string = '';
   public staticDomains: string = '[]';
   public wsRoot: string = '';
   public resourceRoot: string = '';
   public servicesPath: string = '';
   public application: string = '';
   public product: string = '';
   public pageName: string = '';
   public cssBundles: any = null;

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
   public registerConsumer() {

      // Need this to pass AppData as context field
   }
   unregisterConsumer(control){

   }
   updateConsumers() {

      // Need this to pass AppData as context field
   }
   static initAppData(cfg: any) {
      // @ts-ignore
      AppEnv.setStore('AppData', new AppData(cfg));
   }
   static getAppData(): AppData {
      // @ts-ignore
      return AppEnv.getStore('AppData');
   }
}
export default AppData;
