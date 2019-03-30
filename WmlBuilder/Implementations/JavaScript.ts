import {BaseCode} from './BaseCode';
import {IPreparedNode, Methods} from "../_Generator/Interfaces";

const generator = 'gen';

export class JavaScript implements BaseCode {
   private funcs:{[propertyname:string]:(args:any)=>string} = {};

   constructor() {
      this.funcs[Methods.getter] = (args:any):string=>{
         return [args.source].concat(args.options.map((el)=>{ return '["' + el + '"]'; })).join('');
      }
   }

   getFunction(fnName:Methods, args:any):string {
      return this.funcs[fnName](args);
   }

   getFunctionWithScope(fnName:string, scope:string, args:any):string {
      return ['(', scope, ').apply(', scope, ', [', args.options.join(','), '])'].join('');
   }

   getGlobalDefine(constName:string, constValue:string):string {
      return `const ${constName} = ${constValue};`;
   }

   getLink(name:string):string {
      return name;
   }

   getValue(name:string):string {
      return JSON.stringify(name);
   }

   getObject(name:string, obj: any):string {
      return '{' + [name, ':', this.getStrFromObj(obj)].join(',') + '}';
   }

   joinToString(arr:Array<any>):string {
      return arr.join(' + ');
   }

   getStrFromObj(obj:any, filter?:(any)=>any):string{
      if (typeof obj !== 'object') {

         //TODO:: bullshit code
         return '' + obj;
      }

      let s = '{';
      let partOfObject = [];
      for(let i in obj) {
         let res = [i, obj[i]];
         if (i === '__specialOptionForControl') {
            continue;
         }
         if (filter) {
            filter(res);
         }
         partOfObject.push(res[0]+':'+res[1]);
      }
      s+=partOfObject.join(',') + '}';
      return s;
   }

   createTagPresentation(node:IPreparedNode, tagInfo: string, attr: any, options: any, key_pref: any):string {
      return `${generator}.${node.fn}(${tagInfo}, ${this.getStrFromObj(options)},  ${this.getStrFromObj(attr)}, rootKey+"${key_pref}", globalController)`;
   }

   createTextPresentation(node:IPreparedNode, tagInfo: string, key_pref: any):string {
      return `${generator}.${node.fn}(${tagInfo}, rootKey+"${key_pref}")`;
   }

   getJoinElements(elements:Array<string>):string {
      return `${generator}.joinElements(${elements.join(',')})`;
   }

   getVarsPart(elements:Array<string>):string {
      return elements.join('\n');
   }

   getFullView(fnGenName: string, globals:string, elements:string, rootFn: boolean): string {
      let retPart = rootFn ? 'return ': '';
      let logicParent = rootFn ? 'var globalController = data && data._options ? data : null; ' : '';

      return `${retPart} function ${fnGenName}(data, rootKey, ${generator}) {
         ${logicParent}
         ${globals}
         return ${elements};
      }`;
   }

   getMemoizeData(name:string, returnedValue: string, deps: Array<string>, key_pref: string): string {
      return `var ${name}=${generator}.getMemoData(rootKey+"${key_pref}", ()=>{
         return ${returnedValue}
      }, [${deps.join(',')}]);`;
   }

   getFile(moduleName:string, middle:string, deps:Array<string>):string {
      let depsString = '';
      
      if (deps){
         for (var k=0;k<deps.length;k++) {
            if (deps[k] === 'partial') {
               deps[k] = 'Markup/_process/serviceTag/partial';
            }
            if (depsString) depsString += ',';
            depsString += `import_${k}`;
         }
      }

      return `define("${moduleName}", ${JSON.stringify(deps)}, function(${depsString}) {
         ${middle}
      })`;
   }

   getImport(file:string): string {
      return `import "${file}";`;
   }
}


