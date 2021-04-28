/* global assert */
define('UITest/MarkupSpecification/compareMarkup', ['react-dom/server'], function(ReactDOMServer) {
   'use strict';

   const EMPTY_STRING = '';

   function cleanMarkup(markup) {
      // TODO: выяснить необходимость вырезания этих атрибутов.
      return markup
         .replace(/(\r)|(\n)/g, EMPTY_STRING)
         //.replace(/("ws-[\w]*")|("cfg-[\S]*")/g, '"__id__"')
         //.replace(/ on:click="\[object Object\]"/g, EMPTY_STRING)
         //.replace(/ ws-delegates-tabfocus="(true|false)"/ig, EMPTY_STRING)
         //.replace(/ ws-creates-context="(true|false)"/ig, EMPTY_STRING)
         //.replace(/ __config="__id__"/ig, EMPTY_STRING)
         .replace(/ data-reactroot=""/ig, EMPTY_STRING);
   }

   // eslint-disable-next-line consistent-return
   function compareMarkup(standard, actual) {
      if (actual instanceof Error) {
         return false;
      }

      let cleanStandard = standard;
      let cleanActual = ReactDOMServer.renderToString(actual);
      cleanStandard = cleanMarkup(cleanStandard);
      cleanActual = cleanMarkup(cleanActual);
      assert.deepEqual(cleanStandard, cleanActual);
   }
   return compareMarkup;
});
