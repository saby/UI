define('UI/_builder/Tmpl/decorators', [
   'UI/_builder/Tmpl/expressions/_private/Decorators',
   'Env/Env'
], function decoratorsLoader(Decorators, Env) {
   'use strict';

   /**
    * Проксирование логики работы декораторов.
    * @author Крылов М.А.
    */

   Env.IoC.resolve('ILogger').warn(
      'UI/_builder/Tmpl/decorators',
      '"UI/_builder/Tmpl/decorators" wrapper is deprecated and will be removed. ' +
      'New private module "UI/_builder/Tmpl/expressions/_private/Decorators" will be unreachable.'
   );

   return Decorators;
});
