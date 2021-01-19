
import * as Tmpl from 'Compiler/Tmpl';
import { Config } from 'Compiler/Config';

function resolverControls(path) {
   return 'tmpl!' + path;
}

function fixAstResult(traversed, dependencies, buildConfig) {
   if (Array.isArray(traversed)) {
      return {
         ast: traversed,
         dependencies: dependencies,
         words: [],
         fileName: buildConfig.fileName,
         // @ts-ignore
         reactiveProperties: traversed.reactiveProps,
         buildConfig: buildConfig
      };
   }
   return {
      ast: traversed.astResult,
      dependencies: dependencies,
      words: traversed.words,
      fileName: buildConfig.fileName,
      reactiveProperties: traversed.astResult.reactiveProps,
      buildConfig: buildConfig
   };
}

function buildAST(html, buildConfig) {
   return new Promise(function(resolve, reject) {
      try {
         // Парсим шаблон и строим ast-дерево и набор зависимостей (этап анализа)
         const tmpl = Tmpl.template(html, resolverControls, buildConfig);
         tmpl.handle(function(traversedRaw) {
            let traversed = fixAstResult(traversedRaw, tmpl.dependencies, buildConfig);
            resolve(traversed);
         }, function(error) {
            reject(error);
         });
      } catch (error) {
         reject(error);
      }
   });
}

const DEFAULT_TMPL_NAME = 'AnonymousTemplate';
const TMPL_NAME_STORAGE = { };
TMPL_NAME_STORAGE[DEFAULT_TMPL_NAME] = 0;

function getTemplateName(fileName) {
   if (!fileName) {
      return `${DEFAULT_TMPL_NAME}N${++TMPL_NAME_STORAGE[DEFAULT_TMPL_NAME]}`;
   }
   if (TMPL_NAME_STORAGE.hasOwnProperty(fileName)) {
      TMPL_NAME_STORAGE[fileName] = 0;
      return `${fileName}N${++TMPL_NAME_STORAGE[fileName]}`;
   }
   return fileName;
}

function getBuildConfig(fileName, userConfig) {
   const uniqueFileName = getTemplateName(fileName);
   let validated = userConfig || { };
   return Object.assign({
      config: Config,
      fileName: uniqueFileName,
      componentsProperties: { },
      fromBuilderTmpl: false,
      createResultDictionary: false
   }, validated);
}

export function getAST(html, userBuildConfig, fileName) {
   const buildConfig = getBuildConfig(fileName, userBuildConfig);
   return buildAST(html, buildConfig);
}
