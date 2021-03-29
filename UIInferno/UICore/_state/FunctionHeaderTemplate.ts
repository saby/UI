export default
`/*#DELETE IT START#*/
function debug() { debugger; }
var thelpers = typeof tclosure === \'undefined\' || !tclosure ? arguments[arguments.length - 1] : tclosure;
if (typeof thelpers === "undefined" || !thelpers._isTClosure) {
eval("var thelpers = null;");
thelpers = (function(){return this || (0, eval)(\'this\')})().requirejs("UICore/Executor").TClosure;
}
var depsLocal = typeof _deps === \'undefined\' ? undefined : _deps;
if (typeof includedTemplates === "undefined") {
eval("var includedTemplates = undefined;");
includedTemplates = (this && this.includedTemplates) ? this.includedTemplates : {};
}
/*#DELETE IT END#*/
var templateCount = 0;
var key = thelpers.validateNodeKey(attr && attr.key);
var defCollection = {id: [], def: undefined};
var viewController = thelpers.calcParent(this, typeof currentPropertyName === \'undefined\' ? undefined : currentPropertyName, data);`;
