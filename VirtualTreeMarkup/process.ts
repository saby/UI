import { IStructureCreator } from "../Markup/_process/IStructureCreator";

function flatten(arr, skipundefined) {
    let result = [], i, ln = arr.length;
    for (i = 0; i !== ln; i++) {
       if (Array.isArray(arr[i])) {
          result = result.concat(flatten(arr[i], skipundefined));
       } else {
          if (skipundefined && arr[i] === undefined) {
             continue;
          }
          result.push(arr[i]);
       }
    }
    return result;
 }

 
export class VirtualTreeMarkup implements IStructureCreator{
    public library;

    createText(text:string, key:string) {
        if (!text)
            return undefined;
        return this.library.createTextVNode(text, key);
    }

    createTag(tag:string, children: any, attributes: any, key: string, control?: any) {
       if (!Array.isArray(children)) {
         children = [children];
       }
        let a = {attributes: attributes, events: {}, hooks: {}},
        vnode = this.library.createVNode(this.library.getFlagsForElementVnode(tag),
            tag, 
            attributes && attributes.class || '',
            children,
            children && children.length ? (key ? 8 : 4) : 0,
            a,
            key,
            function (node) {
                if (node) {
                   if (this.control && this.attrs && this.attrs.name) {
                      /*
                      * Если мы в слое совместимости, то имя компонента, которое передали сверху
                      * попадает в атрибуты и записывается в _children
                      * и так вышло, что это имя используется внутри контрола
                      * После синхронизации корневой элемент в шаблоне
                      * перетирает нужного нам ребенка
                      * */
                      if (this.control._options.name === this.attrs.name && node.tagName === 'DIV' &&
                         this.control.hasCompatible && this.control.hasCompatible()) {
                         this.attrs.name += '_fix';
                      }
                      this.control._children[this.attrs.name] = node;
                   }
                }
             }.bind({ control: control, attrs: attributes }));

        vnode.hprops = a;
        vnode.newGen = true;
        return vnode;
    }

    createControl(className, options, attributes, key, logicParent, gen) {
        return {
           generator: gen,
           compound: false,
           invisible: false,
           controlClass: className,
           controlProperties: options, // прикладные опции контрола
           controlInternalProperties: {
               logicParent: logicParent
           }, // служебные опции контрола
           controlAttributes: attributes || {},
           controlEvents: {},
           key: attributes && attributes.key || key,
           controlNodeIdx: -1,
           context: null,
           inheritOptions: {}
        };
    }

    joinElements(elements) {
        if (Array.isArray(elements)) {
            /* Partial может вернуть массив, в результате чего могут появиться вложенные массивы.
             Поэтому здесь необходимо выпрямить массив elements */
            elements = flatten(elements, true);
            return elements;
         } else {
            throw new Error('joinElements: elements is not array');
         }
    }

    createTemplateNode(className, options, attributes, logicParent, gen) {
        return {
            compound: false,
            template: options.template,
            controlProperties: options,
            parentControl: logicParent,
            attributes: attributes,
            type: 'TemplateNode',
            context: gen,
            // Template nodes must participate in reorder DirtyChecking.ts function same as
            // controlNodes do
            key: attributes.key
         };
    }
}