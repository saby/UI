const root = process.cwd(),
   path = require('path'),
   express = require('express'),
   cookieParser = require('cookie-parser'),
   app = express(),
   resourcesPath = path.join('', 'application');

const global = (function() {
   return this || (0, eval)('this');
})();

var requirejs = require(path.join(root, 'node_modules', 'saby-units', 'lib', 'requirejs', 'r.js'));
global.requirejs = requirejs;


const createConfig = require(path.join(root, 'node_modules', 'sbis3-ws', 'WS.Core', 'ext', 'requirejs', 'config.js'));
const config = createConfig(path.join(root,'application'),
   path.join(root, 'application', 'WS.Core'),
   path.join(root, 'application'));

global.require = global.requirejs = require = requirejs;
requirejs.config(config);



app.use(express.static(resourcesPath));
app.use(cookieParser());

const port = process.env.PORT || 777;
app.listen(port);
console.log('app available on port ' + port);

console.log('start init');
require(['Core/core-init'], () => {
   console.log('core init success');
}, (err) => {
   console.log(err);
   console.log('core init failed');
});
/*
app.get('/cdn*', (req, res) => {
   res.redirect('http://wasaby.io' + req.url.replace('/cdn/', '/'));
});*/


const serverRouter = require('Router/ServerRouting');
const UIBase = require('UI/Base');
const tpl = UIBase.BaseRoute;
const constants = require('Env/Env').constants;
constants.isNodePlatform = true;

/*server side render*/
app.get('/:moduleName/*', (req, res) => {

   if (!process.domain) {
      process.domain = {
         enter: function(){},
         exit: function(){}
      };
   }
   process.domain.req = req;

   const appName = serverRouter.getAppName(req);

   try {
      require(appName);
      const html = tpl({
         wsRoot: '/WS.Core/',
         resourceRoot: '/',
         appRoot: '/',
         application: appName
      });
      if (html.addCallback) {
         html.addCallback((htmlRes) => {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(htmlRes);
         });
      } else {
         res.writeHead(200, {'Content-Type': 'text/html'});
         res.end(html);
      }
   }catch(e){
      res.writeHead(404, {'Content-Type': 'text/html'});
      res.end('');
      return;
   }

});

