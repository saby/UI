import {
   IAstNode,
   IConfig,
   IBuilder,
   IPreparedNode,
   ITypeAstNode,
   Methods,
   TypeFunction,
   ICodeDefinition
} from './_Generator/Interfaces';
import {BaseCode} from './Implementations/BaseCode';
import {INodeGenerator} from './_Generator/node/INodeGenerator';
import {Tag} from './_Generator/node/Tag';
import {Text} from './_Generator/node/Text';
import {isWasabyTag} from './_Generator/tag/name';
import {convertPreparedNode, createChildFunction} from './_Generator/converter/preparedNode';

export class Generator implements IBuilder{

   staticObjects:Array<{[propertyname: string]: string}> = [];
   resolvers:{[propertyname:string]:typeof INodeGenerator} = {};
   independetlyFunctions:Array<string> = [];
   objectCount: number = 0;
   optionsCount: number = 0;
   attrsCount: number = 0;
   functionCount: number = 0;
   countEl: number = 0;
   depsModules: Array<string> = [];

   constructor () {
      this.resolvers[ITypeAstNode.tag] = Tag;
      this.resolvers[ITypeAstNode.module] = Tag;
      this.resolvers[ITypeAstNode.text] = Text;

   }

   generateFromInjectedData(node: IAstNode):IPreparedNode {
      return this.generateFromOneAstNode(node);

      /*let readyNode = this.resolvers[node.type].prepareInjectedData(node);
      if (!readyNode) {
         readyNode = this.generateFromOneAstNode(node, config, codeFactory);
         return readyNode;
      }

      readyNode.value = readyNode.value.concat(this.reduceInjectedData(readyNode.children, config, codeFactory));
      return readyNode;*/
   }

   reduceInjectedData(injectedData:Array<IAstNode>):Array<IPreparedNode> {
      const injectedDataReady = injectedData.reduce((prev, next) => {
         prev.push(this.generateFromInjectedData(next));
         return prev;
      }, []);
      return injectedDataReady;
   }

   generateFromOneAstNode(node:IAstNode):IPreparedNode {
      if (!this.resolvers[node.type]) {
         throw new Error('Can\'t find resolver for node with type ' + node.type);
      }
      let currentResolver = new (this.resolvers[node.type])(node);

      const children = currentResolver.getChildren();
      const injectedData = currentResolver.getInjectedData();
      const preparedChildren = this.reduceAst(children);
      const preparedInjectedData = this.reduceInjectedData(injectedData);
      currentResolver.setPreparedChildren(preparedChildren);
      currentResolver.setPreparedInjectedData(preparedInjectedData);
      currentResolver.cookAttributes();
      currentResolver.collectExportedData();

      return currentResolver.getResult();
   }


   reduceAst(ast:Array<IAstNode>):Array<IPreparedNode> {
      const postGenerate = ast.reduce((prev, next) => {
         /*TODO: convert ws:if and ws:else to single node*/
         prev.push(this.generateFromOneAstNode(next));
         return prev;
      }, []);

      return postGenerate;
   }

   generateGlobalsDefines(node:IPreparedNode, name:string, codeFactory: BaseCode):string {
      return codeFactory.getGlobalDefine(name, convertPreparedNode(node, codeFactory));
   }

   getFunctionName():string {
      return '__function_'+this.functionCount;
   }

   getFile(moduleName:string, middle:string, deps:Array<string>, codeFactory: BaseCode):string {
      return codeFactory.getFile(moduleName, middle, deps);
   }

   getFunction (ast:Array<IAstNode>, config: IConfig, codeFactory: BaseCode):string {
      let fnName = this.getFunctionName();
      this.functionCount++;
      let mainFunction = this.getFunctionFromReducedAst(fnName, this.reduceAst(ast), config, codeFactory);
      let middle = this.independetlyFunctions.concat([mainFunction.fullText]).join('\n');
      return this.getFile('wml!'+config.fileName, middle, this.depsModules, codeFactory);
   }

   getNameForImport(module:string):string {
      if (isWasabyTag(module)) {
         module = module.split(':')[1];
      }

      let currentIndex = this.depsModules.indexOf(module);
      if (currentIndex === -1) {
         this.depsModules.push(module);
         currentIndex = this.depsModules.length - 1;
      }
      return 'import_'+currentIndex;
   }

   convertOptionsToExecutionString(options: {[propertyname:string]:Array<IPreparedNode>}, canBeMemo: boolean, config: IConfig, codeFactory: BaseCode):{vars:Array<string>, options: {[propertyname:string]:string}} {
      let dataForGenerating:{[propertyname:string]:string} = {};
      let vars:Array<string> = [];
      for (let opt in options) {
         if (options.hasOwnProperty(opt)){
            let oneOption = this.generateFunctionFromOption(options[opt], config, codeFactory);
            if (oneOption.type) {
               if (canBeMemo) {
                  dataForGenerating[opt] = oneOption.data.fullText;
               } else {
                  vars.push(oneOption.data.vars);
                  dataForGenerating[opt] = oneOption.data.returned;
               }
            } else {
               dataForGenerating[opt] = oneOption.data.fullText;
            }
         }
      }
      return {vars: vars, options: dataForGenerating};
   }

   convertAttributesToExecutionString(attributes: {[propertyname:string]:Array<IPreparedNode>}, codeFactory: BaseCode):{[propertyname:string]:string} {
      let attributesForGenerating:{[propertyname:string]:string} = {};
      for (let attr in attributes) {
         if (attributes.hasOwnProperty(attr)) {
            let attrData = attributes[attr];
            attributesForGenerating[attr] =
               codeFactory.joinToString(attrData.map((oneNode)=>{ return convertPreparedNode(oneNode, codeFactory) }));
         }
      }
      return attributesForGenerating;
   }

   isOneOfObjectText(options:{[propertyname:string]:Array<IPreparedNode>}):boolean {
      for (let opt in options) {
         if (options.hasOwnProperty(opt)){
            let isText = options[opt].find((el) => {
               return el.fn === Methods.createText;
            });
            if (isText) {
               return true;
            }
         }
      }
      return false;
   } 

   transformObjectWithMemoize(dataForGenerating:{[propertyname:string]:string}, 
      baseName: string, 
      canBeMemo: boolean, 
      canBeIndepends: boolean,
      exportedOptions: Array<IPreparedNode>, 
      codeFactory: BaseCode): {name: string, globals:Array<string>} {
         let finalName = 'null';
         let globals:Array<string> = [];

         if (Object.keys(dataForGenerating).length > 0) {
            finalName = baseName;
            let optLocal = codeFactory.getStrFromObj(dataForGenerating);
            if (canBeMemo){
               if (exportedOptions.length > 0) {
                  globals.push(codeFactory.getMemoizeData(finalName, optLocal,
                     exportedOptions.filter((oneNode)=>{
                        return oneNode.type !== TypeFunction.importLink;
                     }).map((oneNode) => {
                        return convertPreparedNode(oneNode, codeFactory);
                     }), '_'+(++this.countEl)));
               } else {
                  if (!canBeIndepends) {
                     finalName = optLocal;
                  } else {
                     this.independetlyFunctions.push(codeFactory.getGlobalDefine(finalName, optLocal));
                  }
               }
            } else {

               if (Object.keys(dataForGenerating).length === 1 && dataForGenerating["content"]) {
                  finalName = dataForGenerating["content"];
               } else {
                  finalName = optLocal;
               }
            }
         }
         return {name: finalName, globals: globals};
   }


   getFunctionFromReducedAst (fnName: string, reduced:Array<IPreparedNode>, config: IConfig, codeFactory: BaseCode):ICodeDefinition {
      let independs:boolean = true;

      
      /* bypass root nodes 
       * Extracting independence variables to "prepared.globals" array
       * Collecting functions for create each element to "prepared.elements" 
       */
      let prepared = reduced.reduce((prev, next) => {
         /*Collect all imports */
         if (next.exportedOptions) {
            next.exportedOptions.forEach((element) => {
               if (element.type === TypeFunction.import) {
                  let nameLink = this.getNameForImport(element.name);
                  element.type = TypeFunction.importLink;
                  element.name = nameLink;
               }
            });
         }

         if (next.exportedOptions && next.exportedOptions.length > 0
               || next.exportedAttributes && next.exportedAttributes.length >0) {
            //if node doesn't have any exported data - it's independed function
            //it can be defined as global function
            independs = false;
         }

         this.prepareGlobalConfigs(next);

         next.globals.forEach((node)=>{
            for (let nodeName in node) {
               if (node.hasOwnProperty(nodeName)) {
                  prev.globals.push(this.generateGlobalsDefines(node[nodeName], nodeName, codeFactory));
               }
            }
         });


         let dataForGenerating = {};
         let attributesForGenerating = {};


         if (next.arguments) {
            let readyData = this.convertOptionsToExecutionString(next.arguments.options, isWasabyTag(next.name), config, codeFactory);
            prev.globals = prev.globals.concat(readyData.vars);
            dataForGenerating = readyData.options;
            
            attributesForGenerating = this.convertAttributesToExecutionString(next.arguments.attributes, codeFactory);
         }

         let optionsName = '__options_' + this.optionsCount;
         
         //canBeMemo must be false if it's not isWasaby
         //canBeIndepends
         let data = this.transformObjectWithMemoize(dataForGenerating, optionsName, isWasabyTag(next.name), 
            next.arguments ? this.isOneOfObjectText(next.arguments.options) : true, next.exportedOptions, codeFactory);
         optionsName = data.name;
         prev.globals = prev.globals.concat(data.globals);
         if (optionsName !== 'null') {
            this.optionsCount++;
         }
         
         let attrsName = '__attrs_' + this.attrsCount;
         data = this.transformObjectWithMemoize(attributesForGenerating, attrsName, true, true, next.exportedAttributes, codeFactory);
         attrsName = data.name;
         prev.globals = prev.globals.concat(data.globals);
         if (attrsName !== 'null') {
            this.attrsCount++;
         }
         
         prev.elements.push(createChildFunction(next, attrsName, optionsName, '_'+(++this.countEl), codeFactory));

         return prev;
      }, { globals: [], elements: [] });

      let returned = codeFactory.getJoinElements(prepared.elements);
      let vars = codeFactory.getVarsPart(prepared.globals);
      let fnText = codeFactory.getFullView(fnName, vars, returned, fnName === '__function_0');
      if (independs) {
         this.independetlyFunctions.push(fnText);
         return {
            returned: fnName, 
            vars: '', 
            fullText: fnName
         };
      }
      return  {
         returned: returned, 
         vars: vars, 
         fullText: fnText
      };
   }

   isFunctionOption(data:Array<IPreparedNode>):boolean {
      for(let i=0;i<data.length;i++){
         if (data[i].type === TypeFunction.child) {
            return true;
         }
      }
      return false;
   }

   isTextOption(data:Array<IPreparedNode>):boolean {
      for(let i=0;i<data.length;i++){
         if (data[i].fn === Methods.createText) {
            return true;
         }
      }
      return false;
   }

   isObjectOption(data:Array<IPreparedNode>):boolean {
      for(let i=0;i<data.length;i++){
         if (data[i].type === TypeFunction.object) {
            return true;
         }
      }
      return false;
   }

   generateFunctionFromOption(data:Array<IPreparedNode>, config: IConfig, codeFactory: BaseCode):{type:number, name?: string, data: ICodeDefinition} {
      if (this.isFunctionOption(data)) {
         let innerFn = this.getFunctionName();
         this.functionCount++;
         return {
            type: 1,
            name: innerFn,
            data: this.getFunctionFromReducedAst(innerFn, data, config, codeFactory)
         };
      } else if (this.isObjectOption(data)){
         //TODO: do something
      } else if (this.isTextOption(data)) {
         data[0].name = codeFactory.joinToString( data[0].value.map((el)=>{
            return convertPreparedNode(el, codeFactory);
         }) );
         return {
            type: 0,
            data: {
               returned: '',
               vars: '',
               fullText: codeFactory.createTextPresentation(data[0], data[0].name, '_'+(++this.countEl))
            }
         }
      }
      return {
         type: 0,
         data: {
            returned: '', vars: '',
            fullText: codeFactory.joinToString(data.map((oneNode)=>{ return convertPreparedNode(oneNode, codeFactory) }))
         }
      };
   }


   transformToLink(array:Array<IPreparedNode>, globals: Array<{[propertyname:string]:IPreparedNode}>) {
      array.forEach((oneExData)=>{
         /* any data must be converted to link except link and imports*/
         if (oneExData.type !== TypeFunction.link && oneExData.type !== TypeFunction.importLink) {
            let nameGlobal = '__object_' + this.objectCount;
            let objectGlobal = {};
            let finded = globals.find((oneGlobal) => {
               for(let i in oneGlobal) {
                  if (oneGlobal.hasOwnProperty(i)) {
                     if (JSON.stringify(oneGlobal[i]) === JSON.stringify(oneExData)) {
                        nameGlobal = i;
                        return true;
                     }
                  }
               }
               return false;
            })
            if (!finded) {
               this.objectCount++;
               objectGlobal[nameGlobal] = Object.assign({}, oneExData);
               globals.push(objectGlobal);
            }
            for (let i in oneExData) {
               if (oneExData.hasOwnProperty(i)) {
                  delete oneExData[i];
               }
            }
            oneExData.type = TypeFunction.link;
            oneExData.name = nameGlobal;
         }
      });
   }

   //function transforms all exported data into node to link defenition
   prepareGlobalConfigs(data:IPreparedNode) {
      data.globals = [];
      this.transformToLink(data.exportedAttributes, data.globals);
      this.transformToLink(data.exportedOptions, data.globals);
   }


}

