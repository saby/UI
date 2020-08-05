define('UI/_builder/Tmpl/handlers/third-party/dom', function () {
   /**
    * @author Крылов М.А.
    * @deprecated Реализован новый html-парсер
    */
    /******/ return (function(modules) { // webpackBootstrap
        /******/ 	// The module cache
        /******/ 	var installedModules = {};

        /******/ 	// The require function
        /******/ 	function __webpack_require__(moduleId) {

            /******/ 		// Check if module is in cache
            /******/ 		if(installedModules[moduleId])
            /******/ 			return installedModules[moduleId].exports;

            /******/ 		// Create a new module (and put it into the cache)
            /******/ 		var module = installedModules[moduleId] = {
                /******/ 			exports: {},
                /******/ 			id: moduleId,
                /******/ 			loaded: false
                /******/ 		};

            /******/ 		// Execute the module function
            /******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

            /******/ 		// Flag the module as loaded
            /******/ 		module.loaded = true;

            /******/ 		// Return the exports of the module
            /******/ 		return module.exports;
            /******/ 	}


        /******/ 	// expose the modules object (__webpack_modules__)
        /******/ 	__webpack_require__.m = modules;

        /******/ 	// expose the module cache
        /******/ 	__webpack_require__.c = installedModules;

        /******/ 	// __webpack_public_path__
        /******/ 	__webpack_require__.p = "";

        /******/ 	// Load entry module and return exports
        /******/ 	return __webpack_require__(0);
        /******/ })
    /************************************************************************/
    /******/ ([
        /* 0 */
        /***/ function(module, exports, __webpack_require__) {

            var ElementType = __webpack_require__(1);

            var re_whitespace = /\s+/g;
            var re_beginningWhitespace = /^\s+/;
            var re_endingWhitespace = /\s+$/;
            var NodePrototype = __webpack_require__(2);
            var ElementPrototype = __webpack_require__(3);

            function DomHandler(callback, options, elementCB){
                if(typeof callback === "object"){
                    elementCB = options;
                    options = callback;
                    callback = null;
                } else if(typeof options === "function"){
                    elementCB = options;
                    options = defaultOpts;
                }
                this._callback = callback;
                this._options = options || defaultOpts;
                this._elementCB = elementCB;
                this.dom = [];
                this._done = false;
                this._tagStack = [];
                this._parser = this._parser || null;
            }

            //default options
            var defaultOpts = {
                normalizeWhitespace: false, //Replace all whitespace with single spaces
                withStartIndices: false, //Add startIndex properties to nodes
            };

            DomHandler.prototype.onparserinit = function(parser){
                this._parser = parser;
            };

            DomHandler.prototype._trim = function() {
                if (!(this._options.normalizeWhitespace || this._options.ignoreWhitespace)) {
                    return;
                }
                var dom = this.dom;
                if (dom.length) {
                    if (dom[0].type === ElementType.Text) {
                        dom[0].data = dom[0].data.replace(re_beginningWhitespace, '');
                    }
                    if (dom[dom.length - 1].type === ElementType.Text) {
                        dom[dom.length - 1].data = dom[dom.length - 1].data.replace(re_endingWhitespace, '');
                    }
                }
            };

            //Resets the handler back to starting state
            DomHandler.prototype.onreset = function(){
                DomHandler.call(this, this._callback, this._options, this._elementCB);
            };

            //Signals the handler that parsing is done
            DomHandler.prototype.onend = function(){
                if(this._done) return;
                this._done = true;
                this._parser = null;

                // Trim outer whitespaces in parse result not to have needless spaces between templates like
                // {{ someUndefinedValue }}
                // <ws:partial template="wml!..." />
                // {{ someUndefinedValue }}
                // without root tag.
                // TODO: uncomment _trim in https://online.sbis.ru/doc/16a80cfd-11cc-45c8-a521-1be803f6ceb6
                // this._trim();
                this._handleCallback(null);
            };

            DomHandler.prototype._handleCallback =
                DomHandler.prototype.onerror = function(error){
                    if(typeof this._callback === "function"){
                        this._callback(error, this.dom);
                    } else {
                        if(error) throw error;
                    }
                };

            DomHandler.prototype.onclosetag = function(name, isVoidElement, isSelfClosed){
                //if(this._tagStack.pop().name !== name) this._handleCallback(Error("Tagname didn't match!"));
                var elem = this._tagStack.pop();
                if(this._elementCB) this._elementCB(elem);
            };

            DomHandler.prototype._addDomElement = function(element){
                var parent = this._tagStack[this._tagStack.length - 1];
                var siblings = parent ? parent.children : this.dom;
                var previousSibling = siblings[siblings.length - 1];

                element.next = null;

                if(this._options.withStartIndices){
                    element.startIndex = this._parser.startIndex;
                }

                if (this._options.withDomLvl1) {
                    element.__proto__ = element.type === "tag" ? ElementPrototype : NodePrototype;
                }

                if(previousSibling){
                    element.prev = previousSibling;
                    previousSibling.next = element;
                } else {
                    element.prev = null;
                }

                siblings.push(element);
                element.parent = parent || null;
            };

            DomHandler.prototype.onopentag = function(name, attribs){
                var element = {
                    type: name === "script" ? ElementType.Script : name === "style" ? ElementType.Style : ElementType.Tag,
                    name: name,
                    attribs: attribs,
                    children: []
                };

                this._addDomElement(element);

                this._tagStack.push(element);
            };

            DomHandler.prototype.ontext = function(data){
                //the ignoreWhitespace is officially dropped, but for now,
                //it's an alias for normalizeWhitespace
                var normalize = this._options.normalizeWhitespace || this._options.ignoreWhitespace;

                var lastTag, supTag;
                if(!this._tagStack.length && this.dom.length && (lastTag = this.dom[this.dom.length-1]).type === ElementType.Text){
                    if(normalize){
                       supTag = (lastTag.data + data).replace(re_whitespace, " ");
                       if (supTag !== ' ') {
                          lastTag.data = supTag;
                       }
                    } else {
                        lastTag.data += data;
                    }
                } else {
                   if(
                      this._tagStack.length &&
                      (lastTag = this._tagStack[this._tagStack.length - 1]) &&
                      (lastTag = lastTag.children[lastTag.children.length - 1]) &&
                      lastTag.type === ElementType.Text
                   ){
                      if(normalize){
                         supTag = (lastTag.data + data).replace(re_whitespace, " ");
                         if (supTag !== ' ') {
                            lastTag.data = supTag;
                         }
                      } else {
                         lastTag.data += data;
                      }
                   } else {
                      if(normalize){
                         supTag = data.replace(re_whitespace, " ");
                         if (supTag !== ' ') {
                            data = data.replace(re_whitespace, " ");
                            this._addDomElement({
                               data: data,
                               type: ElementType.Text
                            });
                         }
                      } else {
                         this._addDomElement({
                            data: data,
                            type: ElementType.Text
                         });
                      }
                   }
                }
            };

            DomHandler.prototype.oncomment = function(data){
                var lastTag = this._tagStack[this._tagStack.length - 1];

                if(lastTag && lastTag.type === ElementType.Comment){
                    lastTag.data += data;
                    return;
                }

                var element = {
                    data: data,
                    type: ElementType.Comment
                };

                this._addDomElement(element);
                this._tagStack.push(element);
            };

            DomHandler.prototype.oncdatastart = function(){
                var element = {
                    children: [{
                        data: "",
                        type: ElementType.Text
                    }],
                    type: ElementType.CDATA
                };

                this._addDomElement(element);
                this._tagStack.push(element);
            };

            DomHandler.prototype.oncommentend = DomHandler.prototype.oncdataend = function(){
                this._tagStack.pop();
            };

            DomHandler.prototype.onprocessinginstruction = function(name, data){
                this._addDomElement({
                    name: name,
                    data: data,
                    type: ElementType.Directive
                });
            };

            module.exports = DomHandler;


            /***/ },
        /* 1 */
        /***/ function(module, exports) {

            //Types of elements found in the DOM
            module.exports = {
                Text: "text", //Text
                Directive: "directive", //<? ... ?>
                Comment: "comment", //<!-- ... -->
                Script: "script", //<script> tags
                Style: "style", //<style> tags
                Tag: "tag", //Any tag
                CDATA: "cdata", //<![CDATA[ ... ]]>
                Doctype: "doctype",

                isTag: function(elem){
                    return elem.type === "tag" || elem.type === "script" || elem.type === "style";
                }
            };


            /***/ },
        /* 2 */
        /***/ function(module, exports) {

            // This object will be used as the prototype for Nodes when creating a
            // DOM-Level-1-compliant structure.
            var NodePrototype = module.exports = {
                firstChild: function () {
                    var children = this.children;
                    return children && children[0] || null;
                },
                lastChild: function () {
                    var children = this.children;
                    return children && children[children.length - 1] || null;
                },
                nodeType: function () {
                    return nodeTypes[this.type] || nodeTypes.element;
                }
            };

            var domLvl1 = {
                tagName: "name",
                childNodes: "children",
                parentNode: "parent",
                previousSibling: "prev",
                nextSibling: "next",
                nodeValue: "data"
            };

            var nodeTypes = {
                element: 1,
                text: 3,
                cdata: 4,
                comment: 8
            };

            for (var key in Object.keys(domLvl1)) {
               if (domLvl1.hasOwnProperty(key)) {
                  NodePrototype[key] = domLvl1[key];
               }
            }
            // ES 6
            //    Object.keys(domLvl1).forEach(function(key) {
            //     // var shorthand = domLvl1[key];
            //     // Object.defineProperty(NodePrototype, key, {
            //     //     get: function() {
            //     //         return this[shorthand] || null;
            //     //     },
            //     //     set: function(val) {
            //     //         this[shorthand] = val;
            //     //         return val;
            //     //     }
            //     // });
            // });


            /***/ },
        /* 3 */
        /***/ function(module, exports, __webpack_require__) {

            // DOM-Level-1-compliant structure
            var NodePrototype = __webpack_require__(2);
            var ElementPrototype = module.exports = Object.create(NodePrototype);

            var domLvl1 = {
                tagName: "name"
            };

         for (var key in Object.keys(domLvl1)) {
            if (domLvl1.hasOwnProperty(key)) {
               ElementPrototype[key] = domLvl1[key];
            }
         }
         // ES6
            // Object.keys(domLvl1).forEach(function(key) {
            //    ElementPrototype[key] = domLvl1[key];
            //     // var shorthand = domLvl1[key];
            //     // Object.defineProperty(ElementPrototype, key, {
            //     //     get: function() {
            //     //         return this[shorthand] || null;
            //     //     },
            //     //     set: function(val) {
            //     //         this[shorthand] = val;
            //     //         return val;
            //     //     }
            //     // });
            // });


            /***/ }
        /******/ ]);
});
