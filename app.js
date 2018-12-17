const root = process.cwd(),
   path = require('path'),
   express = require('express'),
   app = express(),
   resourcesPath = path.join('', 'application');

const global = (function() {
   return this || (0, eval)('this');
})();

const requirejs = require(path.join(root, 'node_modules', 'sbis3-ws', 'ws', 'ext', 'requirejs', 'r.js'));
global.requirejs = requirejs;


const createConfig = require(path.join(root, 'node_modules', 'sbis3-ws', 'ws', 'ext', 'requirejs', 'config.js'));
const config = createConfig(path.join(root,'application'),
   path.join(root, 'application','WS.Core'),
   path.join(root, 'application'),
   { lite: true });

global.require = global.requirejs = require = requirejs;
requirejs.config(config);



app.use(express.static(resourcesPath));

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

app.get('/cdn*', (req, res) => {
   res.redirect('http://dev-cdn.wasaby.io' + req.url.replace('/cdn/', '/'));
});


const serverRouter = require('Router/ServerRouting');
const tpl = require('wml!Controls/Application/Route');

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
         lite: true,
         wsRoot: '/WS.Core/',
         resourceRoot: '/',
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

