define('View/Builder/Tmpl/decorators', [
   'View/Builder/Tmpl/expressions/_private/Decorators',
   'Env/Env'
], function decoratorsLoader(Decorators, Env) {
   'use strict';

   /**
    * @author Крылов М.А.
    */

   Env.IoC.resolve('ILogger').warn(
      'View/Builder/Tmpl/decorators',
      '"View/Builder/Tmpl/decorators" wrapper is deprecated and will be removed. ' +
      'New private module "View/Builder/Tmpl/expressions/_private/Decorators" will be unreachable.'
   );

   return Decorators;
});
