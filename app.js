/** this is similar config for: https://git.sbis.ru/sbis/controls/blob/rc-20.1000/app.js */
const global = (function() {
   return this || (0, eval)('this');
})();

const root = process.cwd();
const fs = require('fs');
const path = require('path');

const hasPathToResources = process.argv[2] && process.argv[2].includes('--applicationRoot=');
const pathToResources = hasPathToResources ? process.argv[2].replace('--applicationRoot=', '') : 'application';

const requirejs = require(path.join('saby-units', 'lib', 'requirejs', 'r.js'));
global.requirejs = requirejs;

// Configuring requirejs
const createConfig = require(path.join(root, pathToResources, 'WS.Core', 'ext', 'requirejs', 'config.js'));
const config = createConfig(
   path.join(root, pathToResources),
   path.join(root, pathToResources, 'WS.Core'),
   path.join(root, pathToResources)
);
requirejs.config(config);

/**
 * Look ma, it cp -R.
 * @param {string} src The path to the thing to copy.
 * @param {string} dest The path to the new copy.
 */
function copyRecursiveSync(src, dest) {
   const exists = fs.existsSync(src);
   const stats = exists && fs.statSync(src);
   const isDirectory = exists && stats.isDirectory();

   if (exists && isDirectory) {
      if (!fs.existsSync(dest)) {
         fs.mkdirSync(dest);
      }

      fs.readdirSync(src).forEach(function(childItemName) {
         copyRecursiveSync(
            path.join(src, childItemName),
            path.join(dest, childItemName)
         );
      });
   } else if (!fs.existsSync(dest)) {
      fs.linkSync(src, dest);
   }
}

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

global.require = global.requirejs = require = requirejs;

console.log('start init');
require(['Core/core-init'], function(){
   console.log('core init success');
}, function(err){
   console.log(err);
   console.log('core init failed');
});

/*server side render*/
app.get('/:moduleName/*', function(req, res){

   req.compatible = false;

   if (!process.domain) {
      process.domain = {
         enter: function(){},
         exit: function(){}
      };
   }

   process.domain.req = req;
   process.domain.res = res;

   const tpl = require('wml!Controls/Application/Route');

   let pathRoot = req.originalUrl.split('/');
   let cmp;
   if(!pathRoot) {
      console.error('Incorrect url. Couldn\'t resolve path to root component');
   } else {
      cmp = '';
   }
   pathRoot = pathRoot.filter(function(el) {
      return el.length > 0;
   });
   if(~pathRoot.indexOf('app')) {
      cmp = pathRoot[0] + '/Index';
   } else {
      cmp = pathRoot.join('/') + '/Index';
   }
   try {
      require(cmp);
   } catch(error){
      res.writeHead(404, {
         'Content-Type': 'text/html'
      });
      res.end('');

      return;
   }

   require('Env/Env').constants.resourceRoot = '/';

   const html = tpl({
      lite: true,
      wsRoot: '/WS.Core/',
      resourceRoot: '/',
      application: cmp,
      appRoot: '/',
      preInitScript: 'window.wsConfig.debug = true;'
   });

   if (html.addCallback) {
      html.addCallback(function(htmlres) {
         res.writeHead(200, {
            'Content-Type': 'text/html'
         });
         res.end(htmlres);
      });
   } else {
      res.writeHead(200, {
         'Content-Type': 'text/html'
      });
      res.end(html);
   }
});
