import DataContext = require('Core/DataContext');

class AppData extends DataContext {
   public jsLinks: Array<string> = [];

   private RUMEnabled: Boolean = false;
   private buildnumber: string = '';
   private appRoot: string = '';
   private staticDomains: string = '[]';
   private wsRoot: string = '';
   private resourceRoot: string = '';
   private servicesPath: string = '';
   private application: string = '';
   private product: string = '';
   private pageName: string = '';
   private cssBundles: any = null;

   constructor(cfg: any) {
      super(cfg);

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
}

export default AppData;
