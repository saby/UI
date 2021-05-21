/* global it, assert */
define('ReactUnitTest/MarkupSpecification/testing', [
   'ReactUnitTest/MarkupSpecification/template-engine',
   'ReactUnitTest/MarkupSpecification/asserts'
], function(TemplateEngine, Asserts) {
   'use strict';

   const DEFAULT_TIMEOUT = 2000;

   /**
    * Получить пару зависимостей (шаблон, эталон) для тестирования шаблонов в файлах.
    * @param domain Местоположение тестовых файлов.
    * @param fileName Имя файла шаблона.
    * @returns {[template, standard]} Массив зависимостей (шаблон, эталон).
    */
   function getFileDependencies(domain, fileName) {
      const filePath = 'text!' + domain + fileName;
      return [
         filePath + '.tmpl',
         filePath + '.check.tmpl'
      ];
   }

   function buildFile(test, fileName, userBuildConfig, userExecutionConfig, preventLogger) {
      return new Promise(function(resolve, reject) {
         require(getFileDependencies(test.domain, fileName), function(html, standard) {
            TemplateEngine
               .getMarkup(html, userBuildConfig, userExecutionConfig, fileName, preventLogger)
               .then(function(artifact) {
                  test.checkers.push(Asserts.assertMarkup(standard));
                  resolve(artifact);
               })
               .catch(function(error) {
                  reject(error);
               });
         }, function(error) {
            reject(error);
         });
      });
   }

   function build(test, userBuildConfig, userExecutionConfig, preventLogger) {
      if (test.templateFile) {
         return buildFile(test, test.templateFile, userBuildConfig, userExecutionConfig, preventLogger);
      }
      if (test.astOnly) {
         return TemplateEngine.getAST(test.templateStr, userBuildConfig, undefined, preventLogger);
      }
      return TemplateEngine.getMarkup(test.templateStr, userBuildConfig, userExecutionConfig, undefined, preventLogger);
   }

   function executeChecker(checker, artifact) {
      switch (checker.type) {
         case 'markup':
            return checker(artifact.executionConfig.isVdom, artifact.markup);
         case 'options':
            return checker.call(artifact.template, artifact.markup);
         case 'dependencies':
            return checker(artifact.dependencies);
         case 'vdom':
            return checker(artifact.tree);
         case 'reactive':
            return checker(artifact.reactiveProperties);
         case 'error':
            if (artifact instanceof Error) {
               return checker(undefined, artifact, undefined, undefined);
            }
            return checker(artifact.executionConfig.isVdom, artifact, undefined, artifact.errors);
         default:
            return checker.call(artifact.template, artifact);
      }
   }

   function check(checkers, artifact) {
      if (Array.isArray(checkers)) {
         return checkers.map(checker => executeChecker(checker, artifact));
      }
      return executeChecker(checkers, artifact);
   }

   function checkError(checkers, error) {
      if (Array.isArray(checkers)) {
         assert.isFalse(checkers.some(checker => !checker.isPreventLogger));
         return checkers.map(checker => executeChecker(checker, error));
      }
      assert.isTrue(checkers.isPreventLogger);
      return executeChecker(checkers, error);
   }

   function needPreventLogger(checkers) {
      if (Array.isArray(checkers)) {
         return checkers.some(checker => !!checker.isPreventLogger);
      }
      return !!checkers.isPreventLogger;
   }

   function runTest(testName, test, buildConfig, executionConfig) {
      const timeout = test.timeout || DEFAULT_TIMEOUT;
      it(testName, function(done) {
         if (typeof test.beforeTest === 'function') {
            test.beforeTest();
         }
         let preventLogger = needPreventLogger(test.checkers);
         build(test, buildConfig, executionConfig, preventLogger)
            .then(function(artifact) {
               if (typeof test.afterTest === 'function') {
                  test.afterTest();
               }
               try {
                  check(test.checkers, artifact);
                  done();
               } catch (error) {
                  done(error);
               }
            })
            .catch(function(error) {
               try {
                  checkError(test.checkers, error);
                  done();
               } catch (e) {
                  done(e);
               }
            });
      }).timeout(timeout);
   }

   function canRun(test) {
      return (test.onlyClient && typeof window !== 'undefined') || !test.onlyClient;
   }

   function runTests(tests) {
      Object.keys(tests).forEach(function(testName) {
         let test = tests[testName];
         if (canRun(test)) {
            let userBuildConfig = test.buildConfig || { };
            let userExecutionConfig = test.executionConfig || { };
            // if (!test.vdomOnly || test.tmplOnly) {
            //    userExecutionConfig.isVdom = false;
            //    runTest(testName, test, userBuildConfig, userExecutionConfig);
            // }
            if ((!test.tmplOnly || test.vdomOnly) && !test.astOnly) {
               userExecutionConfig.isVdom = true;
               runTest('React ' + testName, test, userBuildConfig, userExecutionConfig);
            }
         }
      });
   }

   return {
      runTests: runTests
   };
});
