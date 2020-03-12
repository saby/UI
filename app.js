const path = require('path');

const hasPathToResources = process.argv[2] && process.argv[2].includes('--applicationRoot=');
const pathToResources = hasPathToResources ? process.argv[2].replace('--applicationRoot=', '') : 'application';
const root =path.join( process.cwd(), pathToResources);

const requirejs = require(path.join('saby-units', 'lib', 'requirejs', 'r.js'));

// Configuring requirejs
global.define = define = requirejs.define;
global.requirejs = requirejs;
const getRequireJsConfig = require(root + '/WS.Core/ext/requirejs/config.js');

requirejs.config(getRequireJsConfig(root, 'WS.Core', root));
global.require = global.requirejs = require = (url) => requirejs(url.replace('.min', ''));
requirejs(['Core/core-init', 'Core/patchRequireJS']);
requirejs('Env/Env').constants.resourceRoot = '/';

const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const serveStatic = require('serve-static');
const app = express();

app.use(bodyParser.json());
app.use(cookieParser());
app.use('/', serveStatic(pathToResources));


const port = process.env.PORT || 777;
app.listen(port);

console.log('app available on port ' + port);

/*server side render*/
app.get('/:moduleName/*', function (req, res) {

   req.compatible = false;

   if (!process.domain) {
      process.domain = {
         enter: function () { },
         exit: function () { }
      };
   }

   process.domain.req = req;
   process.domain.res = res;
   if (req.path.includes('.')) {
      res.sendFile(path.join(root, req.url.replace('.min', '')));
      return;
   }
   const tpl = require('wml!Controls/Application/Route');
   const application = getApplicationName(req.path);
   try {
      require(application);
   } catch (error) {
      console.error(error);
      res.end(JSON.stringify(error, null, 2));
      return;
   }
   Promise.resolve(tpl({
      lite: true,
      wsRoot: '/WS.Core/',
      resourceRoot: '/',
      application,
      appRoot: '/',
      preInitScript: 'window.wsConfig.debug = true;'
   })).then(function (htmlres) {
      res.writeHead(200, {
         'Content-Type': 'text/html'
      });
      res.end(htmlres);
   }).catch((e) => {
      console.error(e);
      res.end(JSON.stringify(e, null, 2));
   });
});


function getApplicationName(url) {
   const lastSlash = url.lastIndexOf('/');
   const firstSlash = url.indexOf('/');
   if (lastSlash !== (url.length - 1)) {
      return url.substr(firstSlash + 1);
   }
   return url.substr(firstSlash + 1).substring(0, lastSlash - 1);
}