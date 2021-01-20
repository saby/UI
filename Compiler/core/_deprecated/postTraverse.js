define('Compiler/core/_deprecated/postTraverse', [
   'Compiler/expressions/_private/DirtyCheckingPatch',
   'Compiler/utils/Helpers'
], function(
   dirtyCheckingPatch,
   Utils
) {
   'use string';

   /**
    * @deprecated
    * @description Модуль предназначен для аннотации дерева - проставления internal коллекций
    *    и сбора реактивных свойств (старый алгоритм)
    * @author Крылов М.А.
    * @file Compiler/core/_deprecated/postTraverse.js
    */

   /**
    * Get elements.
    * @param element {*} Current element.
    * @param realFrom {*} From element.
    * @returns {{from: *, element: *}}
    */
   function getElementAndFrom(element, realFrom) {
      var from = element.from;
      var currentElement = element.element;
      while (from.array !== realFrom.array) {
         currentElement = from.parent;
         from = from.parentFrom;
      }
      return {
         element: currentElement,
         from: from
      };
   }

   /**
    * Get parent array.
    * @param elements {[]} Elements collection.
    * @param child {*} Current child.
    * @returns {[]}
    */
   function getParentArray(elements, child) {
      var forMove = [];
      var minDepsEl = child[elements[0].control];
      var minDeps = minDepsEl.deps;
      var i;

      for (i = 1; i < elements.length; i++) {
         var ch = child[elements[i].control];
         var chDeps = ch.deps;
         if (minDeps > chDeps) {
            minDeps = chDeps;
            minDepsEl = ch;
         }
      }
      for (i = 0; i < elements.length; i++) {
         var chName = elements[i].control;
         var toMove = getElementAndFrom(child[chName], minDepsEl.from);
         toMove.name = chName;
         toMove.attrName = elements[i].to;
         forMove.push(toMove);
      }
      return forMove;
   }

   /**
    * Process elements.
    */
   function compositeProcessing(traversed, _hocs, _childMap, _deps, from) {
      var childMap = _childMap || {};
      var deps = _deps || 0;
      var hocs = _hocs || [];
      var currentHoc;

      if (traversed.attribs) {
         // Мы внутри AST узла
         if (traversed.attribs.name && traversed.attribs.name.data) {
            // Есть имя. Сохраним.
            childMap[traversed.attribs.name && traversed.attribs.name.data.value] = {
               element: traversed,
               from: from,
               deps: deps
            };
         }
         for (var attrName in traversed.attribs) {
            if (attrName.indexOf('ws:') === 0 && traversed.attribs[attrName].data) {
               if (!currentHoc) {
                  currentHoc = {
                     from: from,
                     hoc: traversed,
                     elements: []
                  };
               }
               var nameDest = traversed.attribs[attrName].data.value;
               currentHoc.elements.push({
                  control: nameDest,
                  to: attrName
               });
               delete traversed.attribs[attrName];
            }
         }
         if (currentHoc) {
            hocs.push(currentHoc);
         }
      }
      if (traversed.children) {
         compositeProcessing(traversed.children, hocs, childMap, deps++, {
            array: traversed.children,
            parent: traversed,
            parentFrom: from
         });
      }
      if (traversed.injectedData) {
         compositeProcessing(traversed.injectedData, hocs, childMap, deps++, {
            array: traversed.injectedData,
            parent: traversed,
            parentFrom: from
         });
      }
      if (traversed.length) {
         // Если массив, уходим внутрь
         for (var i = 0; i < traversed.length; i++) {
            compositeProcessing(traversed[i], hocs, childMap, deps++, {
               array: traversed,
               parent: traversed[i],
               parentFrom: from
            });
         }
      }
      return {
         hocs: hocs,
         childMap: childMap
      };
   }

   /**
    * Perform action on main data array
    * @param  {Array} modAST         AST array
    * @param  {Object|Array} traverseObject object or array of objects with tag or text
    * @return {Array}                AST array
    */
   function actionOnMainArray(modAST, traverseObject) {
      if (traverseObject !== undefined && traverseObject.length > 0) {
         for (var i = 0; i < traverseObject.length; i++) {
            if (traverseObject[i]) {
               modAST.push(traverseObject[i]);
            }
         }
      }
      return modAST;
   }

   /**
    * Process ast tree.
    */
   return function resulting(deferred, data) {
      if (data) {
         var astResult = actionOnMainArray([], data);
         var dataComposite = compositeProcessing(astResult);
         var hocs = dataComposite.hocs;
         var child = dataComposite.childMap;
         var hocReplace;
         for (var k = hocs.length - 1; k >= 0; k--) {
            var cHoc = hocs[k];
            var arrayMove = getParentArray(cHoc.elements, child);
            hocReplace = undefined;
            if (!cHoc.hoc.injectedData) {
               cHoc.hoc.injectedData = [];
            }
            for (var j = 0; j < arrayMove.length; j++) {
               cHoc.hoc.injectedData.push({
                  attribs: undefined,
                  children: [arrayMove[j].element],
                  data: undefined,
                  key: 0,
                  name: arrayMove[j].attrName,
                  selfclosing: false,
                  type: 'tag'
               });
               var ind = arrayMove[j].from.array.indexOf(arrayMove[j].element);
               if (j === 0) {
                  arrayMove[j].from.array[ind] = cHoc.hoc;
                  ind = cHoc.from.array.indexOf(cHoc.hoc);
                  cHoc.from.array.splice(ind, 1);
               } else {
                  arrayMove[j].from.array.splice(ind, 1);
               }
               if (hocReplace) {
                  child[arrayMove[j].name] = hocReplace;
               } else {
                  hocReplace = child[arrayMove[j].name];
                  child[arrayMove[j].name].element = cHoc.hoc;
                  child[arrayMove[j].name].from = arrayMove[j].from;
               }
            }
         }

         astResult.__newVersion = true;
         var foundVars = [];
         var foundChildren = [];
         for (var travI = 0; travI < astResult.length; travI++) {
            try {
               foundVars = foundVars.concat(dirtyCheckingPatch.gatherReactive(astResult[travI]));
               foundChildren = foundChildren.concat(astResult[travI].childrenStorage || []);
            } catch (error) {
               deferred.errback(new Error(
                  'Something wrong with ' + this.fileName + ' template. ' + error.message
               ));
               return undefined;
            }
         }

         // формируем набор реактивных свойств, "служебные" свойства игнорируем
         astResult.reactiveProps = Utils.uniq(foundVars).filter(function(item) {
            return item !== '...' && item !== '_options' && item !== '_container' && item !== '_children' && item !== 'rk';
         });

         astResult.childrenStorage = foundChildren;

         // в случае сбора словаря локализуемых слов отдаем объект
         // { astResult - ast-дерево, words - словарь локализуемых слов }
         if (this.createResultDictionary) {
            deferred.callback({
               astResult: astResult,
               words: this.words
            });
         } else {
            deferred.callback(astResult);
         }
         return astResult;
      }
      deferred.errback(new Error('Something wrong with ' + this.fileName + ' template.'));
      return undefined;
   };
});
