/* global describe, it, assert */
define([
   'Compiler/expressions/_private/Statement',
   'Compiler/expressions/_private/Process',
   'UITest/_compiler/Template'
], function(Statement, Process, TemplateEngine) {
   'use strict';

   /**
    * Для удобства отладки сообщения об ошибках дополняем текстовым представлением наборов.
    * @param internal Реальный internal набор, который нужно отфильтровать и привести к строке.
    */
   function stringifyInternal(internal) {
      let r = { };
      Object.keys(internal).forEach(function(p) {
         r[p] = internal[p].data[0].name.string;
      });
      return JSON.stringify(r, undefined, ' ');
   }

   /**
    * Проверяем каждый AST-узел дерева.
    * @param ast AST-дерево.
    * @param expectedAstFrame Эталонный набор свойств AST-дерева древовидной структуры.
    */
   function checkTreeRecursive(ast, expectedAstFrame) {
      let idx, name, expIntStr, actIntStr;
      expIntStr = expectedAstFrame.internal ? JSON.stringify(expectedAstFrame.internal, undefined, ' ') : 'None';
      actIntStr = ast.internal ? stringifyInternal(ast.internal) : 'None';

      // Проверяем набор служебных выражений
      assert.strictEqual(!!ast.internal, !!expectedAstFrame.internal,
         '(Un)Expected internal set.' +
         '\nExpected: ' + expIntStr +
         '\nBut got: ' + actIntStr +
         '\nAt ast node "' + ast.name + '"');
      if (expectedAstFrame.internal) {
         let names = Object.keys(expectedAstFrame.internal);
         assert.strictEqual(Object.keys(ast.internal).length, names.length,
            'Internal sets are not equal.' +
            '\nExpected: ' + expIntStr +
            '\nBut got: ' + actIntStr +
            '\nAt ast node "' + ast.name + '"');
         for (idx = 0; idx < names.length; ++idx) {
            name = names[idx];
            assert.strictEqual(
               expectedAstFrame.internal[name].replace(/\s/g, ''),
               ast.internal[name].data[0].name.string.replace(/\s/g, ''),
               'Values are not equal for internal.' +
               '\nExpected: ' + expIntStr +
               '\nBut got: ' + actIntStr +
               '\nAt ast node "' + ast.name + '"'
            );
         }
      }

      // Проверяем вложенный контент
      if (expectedAstFrame.injectedData) {
         // Если нужно смотреть в injectedData
         assert.strictEqual(ast.injectedData.length, expectedAstFrame.injectedData.length,
            'Injected data count for ast node "' + ast.name + '"');
         for (idx = 0; idx < ast.injectedData.length; ++idx) {
            checkTreeRecursive(ast.injectedData[idx], expectedAstFrame.injectedData[idx]);
         }
      } else if (expectedAstFrame.children) {
         // Если нужно смотреть в children
         assert.strictEqual(ast.children.length, expectedAstFrame.children.length,
            'Children count for ast node "' + ast.name + '"');
         for (idx = 0; idx < ast.children.length; ++idx) {
            checkTreeRecursive(ast.children[idx], expectedAstFrame.children[idx]);
         }
      }
      assert.strictEqual(!!ast.isContentOption, !!expectedAstFrame.isContentOption,
         'Content option flag for ast node "' + ast.name + '"');
   }

   /**
    * Проверяем каждый AST-узел дерева.
    * @param tree AST-дерево (массив).
    * @param expectedAstFrame Эталонный набор свойств AST-дерева древовидной структуры (массив).
    */
   function checkTree(tree, expectedAstFrame) {
      let index;
      for (index = 0; index < expectedAstFrame.length; ++index) {
         checkTreeRecursive(tree[index], expectedAstFrame[index]);
      }
   }

   /**
    * Выполнить разбор и построение шаблона.
    * @param html Текст шаблона.
    * @returns Promise.
    */
   function getAst(html) {
      return new Promise(function(resolve, reject) {
         TemplateEngine.getAST(html, { fromBuilderTmpl: true })
            .then(function(artifact) {
               resolve(artifact.ast);
            })
            .catch(function(error) {
               reject(error);
            });
      });
   }

   describe('Compiler/expressions/_private/DirtyCheckingPatch', function() {
      describe('Function gatherReactive()', function() {
         it('Check function before apply it (internal)', function() {
            const html = 'a.b.c("g") && a.b.d && a.b.e.f';
            const program = Statement.processProperty(html);
            const standard = '' +
               '(thelpers.getter(data, ["a","b","c"]) !== undefined' +
               '&&thelpers.getter(data, ["a","b","c"])' +
               '.apply(thelpers.getter(data, ["a","b"]), ["g"]))' +
               '&&thelpers.getter(data, ["a","b","d"])' +
               '&&thelpers.getter(data, ["a","b","e","f"])';
            const actual = Process.processExpressions(program, {}, '', false, {}, '__dirtyCheckingVars_0');
            assert.strictEqual(actual, standard);
         });
         it('Check function before apply it (internal) 2', function() {
            const html = '!a.b.c("g") && a.b.d && a.b.e.f';
            const program = Statement.processProperty(html);
            const standard = '' +
               '!(thelpers.getter(data, ["a","b","c"]) !== undefined' +
               '&&thelpers.getter(data, ["a","b","c"])' +
               '.apply(thelpers.getter(data, ["a","b"]), ["g"]))' +
               '&&thelpers.getter(data, ["a","b","d"])' +
               '&&thelpers.getter(data, ["a","b","e","f"])';
            const actual = Process.processExpressions(program, {}, '', false, {}, '__dirtyCheckingVars_0');
            assert.strictEqual(actual, standard);
         });
         it('Check function before apply it (not internal)', function() {
            const html = 'a.b.c("g") && a.b.d && a.b.e.f';
            const program = Statement.processProperty(html);
            const standard = '' +
               'thelpers.getter(data, ["a","b","c"])' +
               '.apply(thelpers.getter(data, ["a","b"]), ["g"])' +
               '&&thelpers.getter(data, ["a","b","d"])' +
               '&&thelpers.getter(data, ["a","b","e","f"])';
            const actual = Process.processExpressions(program, {}, '', false, {}, 'option');
            assert.strictEqual(actual, standard);
         });
         describe('Simple elements', function() {
            it('Validate reactive properties for primitives', function(done) {
               const html = '' +
                  '<div>' +
                  '  <div if="{{ _canBeUndef === undefined }}">undefined</div>' +
                  '  <div if="{{ _canBeNull === null }}">null</div>' +
                  '  <div if="{{ _canBeString === \'string\' }}">string</div>' +
                  '  <div if="{{ _canBeNumber === 3.1415 }}">number</div>' +
                  '  <div if="{{ _canBeTrue === true }}">true</div>' +
                  '  <div if="{{ _canBeFalse === false }}">false</div>' +
                  '  <div if="{{ _canBeNaN === NaN }}">NaN (never compare like this)</div>' +
                  '</div>';
               const expectedAstFrame = [{
                  isContentOption: false,
                  internal: {
                     '__dirtyCheckingVars_0': '_canBeUndef===undefined',
                     '__dirtyCheckingVars_1': '_canBeNull===null',
                     '__dirtyCheckingVars_2': '_canBeString===\'string\'',
                     '__dirtyCheckingVars_3': '_canBeNumber===3.1415',
                     '__dirtyCheckingVars_4': '_canBeTrue===true',
                     '__dirtyCheckingVars_5': '_canBeFalse===false',
                     '__dirtyCheckingVars_6': '_canBeNaN===NaN'
                  }
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Elements only', function(done) {
               const html = '<div>Hello, Wasaby!</div>';
               const expectedAstFrame = [{
                  isContentOption: false,
                  internal: { /* Empty root internal */ }
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Root data', function(done) {
               const html = '<div>Hello, {{ name }}</div>';
               const expectedAstFrame = [{
                  isContentOption: false,
                  internal: {
                     '__dirtyCheckingVars_0': 'name',
                  },
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Cycle foreach chain', function(done) {
               const html = '' +
                  '<ws:for data="index1, item1 in collection1">' +
                  '  <ws:for data="index2, item2 in collection2">' +
                  '    <ws:for data="index3, item3 in collection3">' +
                  '      <div>{{ index1 }}: {{ item1.name }}</div>' +
                  '      <div>{{ index2 }}: {{ item2.name }}</div>' +
                  '      <div>{{ index3 }}: {{ item3.name }}</div>' +
                  '    </ws:for>' +
                  '  </ws:for>' +
                  '</ws:for>';
               const expectedAstFrame = [{
                  isContentOption: false, // ws:for 1
                  internal: {
                     '__dirtyCheckingVars_0': 'collection1',
                     '__dirtyCheckingVars_1': 'collection2',
                     '__dirtyCheckingVars_2': 'collection3'
                  },
                  children: [{
                     isContentOption: false, // ws:for 2
                     children: [{
                        isContentOption: false, // ws:for 3
                        children: [{
                           isContentOption: false, // div 1
                        }, {
                           isContentOption: false, // div 2
                        }, {
                           isContentOption: false, // div 3
                        }],
                     }]
                  }]
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Cycle for #1', function(done) {
               const html = '' +
                  '<ws:for data="a1.init(); a1.test(); a1.update()">' +
                  '  <ws:for data="a2.init(); a2.test(); a2.update()">' +
                  '    <ws:for data="a3.init(); a3.test(); a3.update()">' +
                  '      <div>{{ a1.getIndex() }}: {{ a1.getName() }}</div>' +
                  '      <div>{{ a2.getIndex() }}: {{ a2.getName() }}</div>' +
                  '      <div>{{ a3.getIndex() }}: {{ a3.getName() }}</div>' +
                  '    </ws:for>' +
                  '  </ws:for>' +
                  '</ws:for>';
               const expectedAstFrame = [{
                  isContentOption: false, // ws:for 1
                  internal: {
                     '__dirtyCheckingVars_0': 'a1',
                     '__dirtyCheckingVars_1': 'a2',
                     '__dirtyCheckingVars_2': 'a3'
                  },
                  children: [{
                     isContentOption: false, // ws:for 2
                     children: [{
                        isContentOption: false, // ws:for 3
                        children: [{
                           isContentOption: false, // div 1
                        }, {
                           isContentOption: false, // div 2
                        }, {
                           isContentOption: false, // div 3
                        }],
                     }]
                  }]
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Cycle for #2', function(done) {
               const html = '' +
                  '<ws:for data="a1.init(); b1.test(); c1.update()">' +
                  '  <ws:for data="a2.init(); b2.test(); c2.update()">' +
                  '    <ws:for data="a3.init(); b3.test(); c3.update()">' +
                  '      <div>{{ a1.getIndex() }}: {{ c1.getName() }}</div>' +
                  '      <div>{{ a2.getIndex() }}: {{ c2.getName() }}</div>' +
                  '      <div>{{ a3.getIndex() }}: {{ c3.getName() }}</div>' +
                  '    </ws:for>' +
                  '  </ws:for>' +
                  '</ws:for>';
               const expectedAstFrame = [{
                  isContentOption: false, // ws:for 1
                  internal: {
                     "__dirtyCheckingVars_0": "a1",
                     "__dirtyCheckingVars_1": "b1",
                     "__dirtyCheckingVars_2": "c1",
                     "__dirtyCheckingVars_3": "a2",
                     "__dirtyCheckingVars_4": "b2",
                     "__dirtyCheckingVars_5": "c2",
                     "__dirtyCheckingVars_6": "a3",
                     "__dirtyCheckingVars_7": "b3",
                     "__dirtyCheckingVars_8": "c3"
                  },
                  children: [{
                     isContentOption: false, // ws:for 2
                     children: [{
                        isContentOption: false, // ws:for 3
                        children: [{
                           isContentOption: false, // div 1
                        }, {
                           isContentOption: false, // div 2
                        }, {
                           isContentOption: false, // div 3
                        }],
                     }]
                  }]
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('If chain', function(done) {
               const html = '' +
                  '<ws:if data="{{ condition1 }}">' +
                  '  <ws:if data="{{ condition2 }}">' +
                  '    <ws:if data="{{ condition3 }}">' +
                  '      <div>{{ data3 }}</div>' +
                  '    </ws:if>' +
                  '    <ws:else>' +
                  '      <div>{{ data2 }}</div>' +
                  '    </ws:else>' +
                  '  </ws:if>' +
                  '  <ws:else>' +
                  '    <div>{{ data1 }}</div>' +
                  '  </ws:else>' +
                  '</ws:if>' +
                  '<ws:else>' +
                  '  <div>No data</div>' +
                  '</ws:else>';
               const expectedAstFrame = [{
                  isContentOption: false, // ws:if 1
                  internal: {
                     '__dirtyCheckingVars_0': 'data3',
                     '__dirtyCheckingVars_1': 'condition3',
                     '__dirtyCheckingVars_2': 'data2',
                     '__dirtyCheckingVars_3': 'condition2',
                     '__dirtyCheckingVars_4': 'data1',
                     '__dirtyCheckingVars_5': 'condition1'
                  },
                  children: [{
                     isContentOption: false, // ws:if 2
                     children: [{
                        isContentOption: false, // ws:if 3
                        children: [{
                           isContentOption: false, // div
                        }],
                     }, {
                        isContentOption: false, // ws:else 3
                        children: [{
                           isContentOption: false, // div
                        }],
                     }],
                  }, {
                     isContentOption: false, // ws:else 2
                     children: [{
                        isContentOption: false, // div
                     }],
                  }],
               }, {
                  isContentOption: false, // ws:else 1
                  children: [{
                     isContentOption: false, // div
                  }],
                  internal: { /* Empty root internal */ },
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Foreach with scope intersection', function(done) {
               const html = '' +
                  '<ws:if data="{{ condition1 }}">' +
                  '  <ws:for data="index1, item1 in collection1">' +
                  '    <ws:if data="{{ index1 < outerIndex }}">' +
                  '      <ws:for data="index2, item2 in collection2">' +
                  '        <ws:if data="{{ index2 < index1 }}">' +
                  '          <ws:for data="index3, item3 in collection3">' +
                  '            <ws:if data="{{ index3 < outerIndex2 }}">' +
                  '              <div>{{ index3 }}: {{ item3.name }}</div>' +
                  '            </ws:if>' +
                  '          </ws:for>' +
                  '        </ws:if>' +
                  '        <ws:else>' +
                  '          <div>No data for {{ index2 }}</div>' +
                  '        </ws:else>' +
                  '      </ws:for>' +
                  '    </ws:if>' +
                  '    <ws:else>' +
                  '      <div>No data for {{ index1 }}</div>' +
                  '    </ws:else>' +
                  '  </ws:for>' +
                  '</ws:if>' +
                  '<ws:else>' +
                  '  <div>No data</div>' +
                  '</ws:else>';
               const expectedAstFrame = [{
                  isContentOption: false, // ws:if 1
                  internal: {
                     '__dirtyCheckingVars_0': 'collection1',
                     '__dirtyCheckingVars_1': 'collection2',
                     '__dirtyCheckingVars_2': 'collection3',
                     "__dirtyCheckingVars_3": "outerIndex2",
                     "__dirtyCheckingVars_4": "outerIndex",
                     "__dirtyCheckingVars_5": "condition1",
                  },
                  children: [{
                     isContentOption: false, // ws:for 1
                     children: [{
                        isContentOption: false, // ws:if 2
                        children: [{
                           isContentOption: false, // ws:for 2
                           children: [{
                              isContentOption: false, // ws:if 3
                              children: [{
                                 isContentOption: false, // ws:for 3
                                 children: [{
                                    isContentOption: false, // ws:if 4
                                    children: [{
                                       isContentOption: false, // div
                                    }],
                                 }],
                              }],
                           }, {
                              isContentOption: false, // ws:else 3
                           }],
                        }],
                     }, {
                        isContentOption: false, // ws:else 2
                     }],
                  }],
               }, {
                  isContentOption: false, // ws:else 1
                  internal: { /* Empty root internal */ }
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('For with scope intersection #1', function(done) {
               const html = '' +
                  '<ws:if data="{{ condition1 }}">' +
                  '  <ws:for data="a1.init(); a1.test(); a1.update()">' +
                  '    <ws:if data="{{ a1.getIndex() < outerIndex }}">' +
                  '      <ws:for data="a2.init(); a2.test(); a2.update()">' +
                  '        <ws:if data="{{ a2.getIndex() < index1 }}">' +
                  '          <ws:for data="a3.init(); a3.test(); a3.update()">' +
                  '            <ws:if data="{{ a3.getIndex() < outerIndex2 }}">' +
                  '              <div>{{ a3.getIndex() }}: {{ a1.getName() }}</div>' +
                  '            </ws:if>' +
                  '          </ws:for>' +
                  '        </ws:if>' +
                  '        <ws:else>' +
                  '          <div>No data for {{ a2.getIndex() }}</div>' +
                  '        </ws:else>' +
                  '      </ws:for>' +
                  '    </ws:if>' +
                  '    <ws:else>' +
                  '      <div>No data for {{ a1.getIndex() }}</div>' +
                  '    </ws:else>' +
                  '  </ws:for>' +
                  '</ws:if>' +
                  '<ws:else>' +
                  '  <div>No data</div>' +
                  '</ws:else>';
               const expectedAstFrame = [{
                  isContentOption: false, // ws:if 1
                  internal: {
                     "__dirtyCheckingVars_0": "a1",
                     "__dirtyCheckingVars_1": "a2",
                     "__dirtyCheckingVars_2": "a3",
                     "__dirtyCheckingVars_3": "outerIndex2",
                     "__dirtyCheckingVars_4": "index1",
                     "__dirtyCheckingVars_5": "outerIndex",
                     "__dirtyCheckingVars_6": "condition1"
                  },
                  children: [{
                     isContentOption: false, // ws:for 1
                     children: [{
                        isContentOption: false, // ws:if 2
                        children: [{
                           isContentOption: false, // ws:for 2
                           children: [{
                              isContentOption: false, // ws:if 3
                              children: [{
                                 isContentOption: false, // ws:for 3
                                 children: [{
                                    isContentOption: false, // ws:if 4
                                    children: [{
                                       isContentOption: false, // div
                                    }],
                                 }],
                              }],
                           }, {
                              isContentOption: false, // ws:else 3
                           }],
                        }],
                     }, {
                        isContentOption: false, // ws:else 2
                     }],
                  }],
               }, {
                  isContentOption: false, // ws:else 1
                  internal: { /* Empty root internal */ }
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
         });
         describe('Controls', function() {
            it('Controls chain and div in content', function(done) {
               const html = '' +
                  '<WSUnit.resources.dirtyCheckingPatchTest a="{{ a }}">' +
                  '  <ws:content>' +
                  '    <WSUnit.resources.dirtyCheckingPatchTest b="{{ b }}">' +
                  '      <ws:content>' +
                  '        <WSUnit.resources.dirtyCheckingPatchTest c="{{ c }}">' +
                  '          <ws:content>' +
                  '            <WSUnit.resources.dirtyCheckingPatchTest d="{{ d }}">' +
                  '              <ws:content>' +
                  '                <div>{{ message }}</div>' +
                  '              </ws:content>' +
                  '            </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '          </ws:content>' +
                  '        </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '      </ws:content>' +
                  '    </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '  </ws:content>' +
                  '</WSUnit.resources.dirtyCheckingPatchTest>';
               const expectedAstFrame = [{
                  isContentOption: false, // Control 1
                  internal: {
                     '__dirtyCheckingVars_0': 'message',
                     '__dirtyCheckingVars_1': 'd',
                     '__dirtyCheckingVars_2': 'c',
                     '__dirtyCheckingVars_3': 'b',
                     '__dirtyCheckingVars_4': 'a',
                  },
                  injectedData: [{
                     isContentOption: true, // ws:content
                     internal: {
                        '__dirtyCheckingVars_0': 'message',
                        '__dirtyCheckingVars_1': 'd',
                        '__dirtyCheckingVars_2': 'c',
                        '__dirtyCheckingVars_3': 'b',
                     },
                     children: [{
                        isContentOption: false, // Control 2
                        internal: {
                           '__dirtyCheckingVars_0': 'message',
                           '__dirtyCheckingVars_1': 'd',
                           '__dirtyCheckingVars_2': 'c',
                        },
                        injectedData: [{
                           isContentOption: true, // ws:content
                           internal: {
                              '__dirtyCheckingVars_0': 'message',
                              '__dirtyCheckingVars_1': 'd',
                              '__dirtyCheckingVars_2': 'c',
                           },
                           children: [{
                              isContentOption: false, // Control 3
                              internal: {
                                 '__dirtyCheckingVars_0': 'message',
                                 '__dirtyCheckingVars_1': 'd',
                              },
                              injectedData: [{
                                 isContentOption: true, // ws:content
                                 internal: {
                                    '__dirtyCheckingVars_0': 'message',
                                    '__dirtyCheckingVars_1': 'd',
                                 },
                                 children: [{
                                    isContentOption: false, // Control 4
                                    internal: {
                                       '__dirtyCheckingVars_0': 'message',
                                    },
                                    injectedData: [{
                                       isContentOption: true, // ws:content
                                       internal: {
                                          '__dirtyCheckingVars_0': 'message',
                                       },
                                       children: [{
                                          isContentOption: false, // div
                                       }]
                                    }],
                                 }]
                              }],
                           }]
                        }],
                     }]
                  }],
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Controls chain and if in content', function(done) {
               const html = '' +
                  '<WSUnit.resources.dirtyCheckingPatchTest a="{{ a }}">' +
                  '  <ws:content>' +
                  '    <WSUnit.resources.dirtyCheckingPatchTest b="{{ b }}">' +
                  '      <ws:content>' +
                  '        <WSUnit.resources.dirtyCheckingPatchTest c="{{ c }}">' +
                  '          <ws:content>' +
                  '            <WSUnit.resources.dirtyCheckingPatchTest d="{{ d }}">' +
                  '              <ws:content>' +
                  '                <ws:if data="{{ condition }}">' +
                  '                  <div>{{ conditionalData }}</div>' +
                  '                </ws:if>' +
                  '              </ws:content>' +
                  '            </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '          </ws:content>' +
                  '        </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '      </ws:content>' +
                  '    </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '  </ws:content>' +
                  '</WSUnit.resources.dirtyCheckingPatchTest>';
               const expectedAstFrame = [{
                  isContentOption: false, // Control 1
                  internal: {
                     '__dirtyCheckingVars_0': 'conditionalData',
                     '__dirtyCheckingVars_1': 'condition',
                     '__dirtyCheckingVars_2': 'd',
                     '__dirtyCheckingVars_3': 'c',
                     '__dirtyCheckingVars_4': 'b',
                     '__dirtyCheckingVars_5': 'a',
                  },
                  injectedData: [{
                     isContentOption: true, // ws:content
                     internal: {
                        '__dirtyCheckingVars_0': 'conditionalData',
                        '__dirtyCheckingVars_1': 'condition',
                        '__dirtyCheckingVars_2': 'd',
                        '__dirtyCheckingVars_3': 'c',
                        '__dirtyCheckingVars_4': 'b',
                     },
                     children: [{
                        isContentOption: false, // Control 2
                        internal: {
                           '__dirtyCheckingVars_0': 'conditionalData',
                           '__dirtyCheckingVars_1': 'condition',
                           '__dirtyCheckingVars_2': 'd',
                           '__dirtyCheckingVars_3': 'c',
                        },
                        injectedData: [{
                           isContentOption: true, // ws:content
                           internal: {
                              '__dirtyCheckingVars_0': 'conditionalData',
                              '__dirtyCheckingVars_1': 'condition',
                              '__dirtyCheckingVars_2': 'd',
                              '__dirtyCheckingVars_3': 'c',
                           },
                           children: [{
                              isContentOption: false, // Control 3
                              internal: {
                                 '__dirtyCheckingVars_0': 'conditionalData',
                                 '__dirtyCheckingVars_1': 'condition',
                                 '__dirtyCheckingVars_2': 'd',
                              },
                              injectedData: [{
                                 isContentOption: true, // ws:content
                                 internal: {
                                    '__dirtyCheckingVars_0': 'conditionalData',
                                    '__dirtyCheckingVars_1': 'condition',
                                    '__dirtyCheckingVars_2': 'd',
                                 },
                                 children: [{
                                    isContentOption: false, // Control 4
                                    internal: {
                                       '__dirtyCheckingVars_0': 'conditionalData',
                                       '__dirtyCheckingVars_1': 'condition',
                                    },
                                    injectedData: [{
                                       isContentOption: true, // ws:content
                                       internal: {
                                          '__dirtyCheckingVars_0': 'conditionalData',
                                          '__dirtyCheckingVars_1': 'condition',
                                       },
                                       children: [{
                                          isContentOption: false, // ws:if
                                          children: [{
                                             isContentOption: false, // div
                                          }],
                                       }]
                                    }],
                                 }]
                              }],
                           }]
                        }],
                     }]
                  }],
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Controls chain and for in content', function(done) {
               const html = '' +
                  '<WSUnit.resources.dirtyCheckingPatchTest a="{{ a }}">' +
                  '  <ws:content>' +
                  '    <WSUnit.resources.dirtyCheckingPatchTest b="{{ b }}">' +
                  '      <ws:content>' +
                  '        <WSUnit.resources.dirtyCheckingPatchTest c="{{ c }}">' +
                  '          <ws:content>' +
                  '            <WSUnit.resources.dirtyCheckingPatchTest d="{{ d }}">' +
                  '              <ws:content>' +
                  '                <ws:for data="item in collection">' +
                  '                  <div>{{ item.name }}</div>' +
                  '                </ws:for>' +
                  '              </ws:content>' +
                  '            </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '          </ws:content>' +
                  '        </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '      </ws:content>' +
                  '    </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '  </ws:content>' +
                  '</WSUnit.resources.dirtyCheckingPatchTest>';
               const expectedAstFrame = [{
                  isContentOption: false, // Control 1
                  internal: {
                     '__dirtyCheckingVars_0': 'collection',
                     '__dirtyCheckingVars_1': 'd',
                     '__dirtyCheckingVars_2': 'c',
                     '__dirtyCheckingVars_3': 'b',
                     '__dirtyCheckingVars_4': 'a',
                  },
                  injectedData: [{
                     isContentOption: true, // ws:content
                     internal: {
                        '__dirtyCheckingVars_0': 'collection',
                        '__dirtyCheckingVars_1': 'd',
                        '__dirtyCheckingVars_2': 'c',
                        '__dirtyCheckingVars_3': 'b',
                     },
                     children: [{
                        isContentOption: false, // Control 2
                        internal: {
                           '__dirtyCheckingVars_0': 'collection',
                           '__dirtyCheckingVars_1': 'd',
                           '__dirtyCheckingVars_2': 'c',
                        },
                        injectedData: [{
                           isContentOption: true, // ws:content
                           internal: {
                              '__dirtyCheckingVars_0': 'collection',
                              '__dirtyCheckingVars_1': 'd',
                              '__dirtyCheckingVars_2': 'c',
                           },
                           children: [{
                              isContentOption: false, // Control 3
                              internal: {
                                 '__dirtyCheckingVars_0': 'collection',
                                 '__dirtyCheckingVars_1': 'd',
                              },
                              injectedData: [{
                                 isContentOption: true, // ws:content
                                 internal: {
                                    '__dirtyCheckingVars_0': 'collection',
                                    '__dirtyCheckingVars_1': 'd',
                                 },
                                 children: [{
                                    isContentOption: false, // Control 4
                                    internal: {
                                       '__dirtyCheckingVars_0': 'collection',
                                    },
                                    injectedData: [{
                                       isContentOption: true, // ws:content
                                       internal: {
                                          '__dirtyCheckingVars_0': 'collection',
                                       },
                                       children: [{
                                          isContentOption: false, // ws:for
                                          children: [{
                                             isContentOption: false, // div
                                          }],
                                       }]
                                    }],
                                 }]
                              }],
                           }]
                        }],
                     }]
                  }],
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Controls chain with cycles', function(done) {
               const html = '' +
                  '<WSUnit.resources.dirtyCheckingPatchTest  a="{{ a }}">' +
                  '  <ws:content>' +
                  '    <WSUnit.resources.dirtyCheckingPatchTest b="{{ b }}">' +
                  '      <ws:content>' +
                  '        <WSUnit.resources.dirtyCheckingPatchTest c="{{ c }}">' +
                  '          <ws:content>' +
                  '            <WSUnit.resources.dirtyCheckingPatchTest d="{{ d }}">' +
                  '              <ws:content>' +
                  '                <div for="id1, item1 in coll1">{{ message }}</div>' +
                  '              </ws:content>' +
                  '            </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '          </ws:content>' +
                  '        </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '      </ws:content>' +
                  '    </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '  </ws:content>' +
                  '</WSUnit.resources.dirtyCheckingPatchTest>';
               const expectedAstFrame = [{
                  isContentOption: false, // Control 1
                  internal: {
                     '__dirtyCheckingVars_0': 'coll1',
                     '__dirtyCheckingVars_1': 'message',
                     '__dirtyCheckingVars_2': 'd',
                     '__dirtyCheckingVars_3': 'c',
                     '__dirtyCheckingVars_4': 'b',
                     '__dirtyCheckingVars_5': 'a'
                  },
                  injectedData: [{
                     isContentOption: true, // ws:content
                     internal: {
                        '__dirtyCheckingVars_0': 'coll1',
                        '__dirtyCheckingVars_1': 'message',
                        '__dirtyCheckingVars_2': 'd',
                        '__dirtyCheckingVars_3': 'c',
                        '__dirtyCheckingVars_4': 'b',
                     },
                     children: [{
                        isContentOption: false, // Control 2
                        internal: {
                           '__dirtyCheckingVars_0': 'coll1',
                           '__dirtyCheckingVars_1': 'message',
                           '__dirtyCheckingVars_2': 'd',
                           '__dirtyCheckingVars_3': 'c',
                        },
                        injectedData: [{
                           isContentOption: true, // ws:content
                           internal: {
                              '__dirtyCheckingVars_0': 'coll1',
                              '__dirtyCheckingVars_1': 'message',
                              '__dirtyCheckingVars_2': 'd',
                              '__dirtyCheckingVars_3': 'c',
                           },
                           children: [{
                              isContentOption: false, // Control 3
                              internal: {
                                 '__dirtyCheckingVars_0': 'coll1',
                                 '__dirtyCheckingVars_1': 'message',
                                 '__dirtyCheckingVars_2': 'd',
                              },
                              injectedData: [{
                                 isContentOption: true, // ws:content
                                 internal: {
                                    '__dirtyCheckingVars_0': 'coll1',
                                    '__dirtyCheckingVars_1': 'message',
                                    '__dirtyCheckingVars_2': 'd',
                                 },
                                 children: [{
                                    isContentOption: false, // Control 4
                                    internal: {
                                       '__dirtyCheckingVars_0': 'coll1',
                                       '__dirtyCheckingVars_1': 'message',
                                    },
                                    injectedData: [{
                                       isContentOption: true, // ws:content
                                       internal: {
                                          '__dirtyCheckingVars_0': 'coll1',
                                          '__dirtyCheckingVars_1': 'message',
                                       },
                                       children: [{
                                          isContentOption: false, // div
                                       }]
                                    }],
                                 }]
                              }],
                           }]
                        }],
                     }]
                  }],
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Controls chain with cycles in div', function(done) {
               const html = '' +
                  '<div>' +
                  '  <WSUnit.resources.dirtyCheckingPatchTest a="{{ a }}">' +
                  '    <ws:content>' +
                  '      <div>' +
                  '        <WSUnit.resources.dirtyCheckingPatchTest b="{{ b }}">' +
                  '          <ws:content>' +
                  '            <div>' +
                  '              <WSUnit.resources.dirtyCheckingPatchTest c="{{ c }}">' +
                  '                <ws:content>' +
                  '                  <div>' +
                  '                    <WSUnit.resources.dirtyCheckingPatchTest d="{{ d }}">' +
                  '                      <ws:content>' +
                  '                        <div for="id1, item1 in coll1">{{ message }}</div>' +
                  '                      </ws:content>' +
                  '                    </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '                  </div>' +
                  '                </ws:content>' +
                  '              </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '            </div>' +
                  '          </ws:content>' +
                  '        </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '      </div>' +
                  '    </ws:content>' +
                  '  </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '</div>';
               const expectedAstFrame = [{
                  isContentOption: false, // div 1
                  internal: {
                     '__dirtyCheckingVars_0': 'coll1',
                     '__dirtyCheckingVars_1': 'message',
                     '__dirtyCheckingVars_2': 'd',
                     '__dirtyCheckingVars_3': 'c',
                     '__dirtyCheckingVars_4': 'b',
                     '__dirtyCheckingVars_5': 'a'
                  },
                  children: [{
                     isContentOption: false, // Control 1
                     internal: {
                        '__dirtyCheckingVars_0': 'coll1',
                        '__dirtyCheckingVars_1': 'message',
                        '__dirtyCheckingVars_2': 'd',
                        '__dirtyCheckingVars_3': 'c',
                        '__dirtyCheckingVars_4': 'b',
                     },
                     injectedData: [{
                        isContentOption: true, // ws:content
                        internal: {
                           '__dirtyCheckingVars_0': 'coll1',
                           '__dirtyCheckingVars_1': 'message',
                           '__dirtyCheckingVars_2': 'd',
                           '__dirtyCheckingVars_3': 'c',
                           '__dirtyCheckingVars_4': 'b',
                        },
                        children: [{
                           isContentOption: false, // div 2
                           children: [{
                              isContentOption: false, // Control 2
                              internal: {
                                 '__dirtyCheckingVars_0': 'coll1',
                                 '__dirtyCheckingVars_1': 'message',
                                 '__dirtyCheckingVars_2': 'd',
                                 '__dirtyCheckingVars_3': 'c',
                              },
                              injectedData: [{
                                 isContentOption: true, // ws:content
                                 internal: {
                                    '__dirtyCheckingVars_0': 'coll1',
                                    '__dirtyCheckingVars_1': 'message',
                                    '__dirtyCheckingVars_2': 'd',
                                    '__dirtyCheckingVars_3': 'c',
                                 },
                                 children: [{
                                    isContentOption: false, // div 3
                                    children: [{
                                       isContentOption: false, // Control 3
                                       internal: {
                                          '__dirtyCheckingVars_0': 'coll1',
                                          '__dirtyCheckingVars_1': 'message',
                                          '__dirtyCheckingVars_2': 'd',
                                       },
                                       injectedData: [{
                                          isContentOption: true, // ws:content
                                          internal: {
                                             '__dirtyCheckingVars_0': 'coll1',
                                             '__dirtyCheckingVars_1': 'message',
                                             '__dirtyCheckingVars_2': 'd',
                                          },
                                          children: [{
                                             isContentOption: false, // div 4
                                             children: [{
                                                isContentOption: false, // Control 4
                                                internal: {
                                                   '__dirtyCheckingVars_0': 'coll1',
                                                   '__dirtyCheckingVars_1': 'message',
                                                },
                                                injectedData: [{
                                                   isContentOption: true, // ws:content
                                                   internal: {
                                                      '__dirtyCheckingVars_0': 'coll1',
                                                      '__dirtyCheckingVars_1': 'message',
                                                   },
                                                   children: [{
                                                      isContentOption: false, // div 5 (for)
                                                   }]
                                                }],
                                             }],
                                          }]
                                       }],
                                    }],
                                 }]
                              }],
                           }],
                        }]
                     }],
                  }],
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Content option with data', function(done) {
               const html = '' +
                  '<WSUnit.resources.dirtyCheckingPatchTest>' +
                  '  <ws:collection>' +
                  '    <ws:Array>' +
                  '      <ws:Object>' +
                  '        <ws:name>' +
                  '          <ws:String>sAaa</ws:String>' +
                  '        </ws:name>' +
                  '        <ws:id>' +
                  '          <ws:Number>1</ws:Number>' +
                  '        </ws:id>' +
                  '      </ws:Object>' +
                  '      <ws:Object>' +
                  '        <ws:name>' +
                  '          <ws:String>sBbb</ws:String>' +
                  '        </ws:name>' +
                  '        <ws:id>' +
                  '          <ws:Number>2</ws:Number>' +
                  '        </ws:id>' +
                  '      </ws:Object>' +
                  '      <ws:Object>' +
                  '        <ws:name>' +
                  '          <ws:String>sCcc</ws:String>' +
                  '        </ws:name>' +
                  '        <ws:id>' +
                  '          <ws:Number>{{ 4 }}</ws:Number>' +
                  '        </ws:id>' +
                  '      </ws:Object>' +
                  '      <ws:Object>' +
                  '        <ws:name>' +
                  '          <ws:String>{{ "sDdd" }}</ws:String>' +
                  '        </ws:name>' +
                  '        <ws:id>' +
                  '          <ws:Number>6</ws:Number>' +
                  '        </ws:id>' +
                  '      </ws:Object>' +
                  '      <ws:Object>' +
                  '        <ws:name>' +
                  '          <ws:String>sEee</ws:String>' +
                  '        </ws:name>' +
                  '        <ws:id>' +
                  '          <ws:Number>7</ws:Number>' +
                  '        </ws:id>' +
                  '      </ws:Object>' +
                  '      <ws:Object>' +
                  '        <ws:name>' +
                  '          <ws:String>sFff</ws:String>' +
                  '        </ws:name>' +
                  '        <ws:id>' +
                  '          <ws:Number>9</ws:Number>' +
                  '        </ws:id>' +
                  '      </ws:Object>' +
                  '      <ws:Object>' +
                  '        <ws:name>' +
                  '          <ws:String>sGgg</ws:String>' +
                  '        </ws:name>' +
                  '        <ws:id>' +
                  '          <ws:Number>{{ 12 }}</ws:Number>' +
                  '        </ws:id>' +
                  '      </ws:Object>' +
                  '      <ws:Object>' +
                  '        <ws:name>' +
                  '          <ws:String>{{ "sHhh" }}</ws:String>' +
                  '        </ws:name>' +
                  '        <ws:id>' +
                  '          <ws:Number>17</ws:Number>' +
                  '        </ws:id>' +
                  '      </ws:Object>' +
                  '    </ws:Array>' +
                  '  </ws:collection>' +
                  '  <ws:indexLimiter>' +
                  '    <ws:Number>5</ws:Number>' +
                  '  </ws:indexLimiter>' +
                  '  <ws:idLimiter>' +
                  '    <ws:Number>10</ws:Number>' +
                  '  </ws:idLimiter>' +
                  '</WSUnit.resources.dirtyCheckingPatchTest>';
               const expectedAstFrame = [{
                  isContentOption: false, // Control
                  internal: { },
                  injectedData: [{
                     isContentOption: false, // collection
                  }, {
                     isContentOption: false, // indexLimiter
                  }, {
                     isContentOption: false, // idLimiter
                  }],
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Content option with root simple markup', function(done) {
               const html = '' +
                  '<WSUnit.resources.dirtyCheckingPatchTest>' +
                  '  <ws:contentTemplate>' +
                  '    <div>Hello, Wasaby!</div>' +
                  '  </ws:contentTemplate>' +
                  '</WSUnit.resources.dirtyCheckingPatchTest>';
               const expectedAstFrame = [{
                  isContentOption: false, // Control 1
                  internal: { },
                  injectedData: [{
                     isContentOption: true, // Content option contentTemplate
                     internal: { },
                     children: [{
                        isContentOption: false, // div 1
                     }],
                  }],
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Content option with root if', function(done) {
               const html = '' +
                  '<WSUnit.resources.dirtyCheckingPatchTest>' +
                  '  <ws:contentTemplate>' +
                  '    <ws:if data="{{ condition }}">' +
                  '      <div>Hello, {{ name }}!</div>' +
                  '    </ws:if>' +
                  '    <ws:else>' +
                  '      <div>Empty</div>' +
                  '    </ws:else>' +
                  '  </ws:contentTemplate>' +
                  '</WSUnit.resources.dirtyCheckingPatchTest>';
               const expectedAstFrame = [{
                  isContentOption: false, // Control 1
                  internal: {
                     '__dirtyCheckingVars_0': 'name',
                     '__dirtyCheckingVars_1': 'condition'
                  },
                  injectedData: [{
                     isContentOption: true, // Content option contentTemplate
                     internal: {
                        '__dirtyCheckingVars_0': 'name',
                        '__dirtyCheckingVars_1': 'condition'
                     },
                     children: [{
                        isContentOption: false, // if
                        children: [{
                           isContentOption: false, // div
                        }]
                     }, {
                        isContentOption: false, // else
                        children: [{
                           isContentOption: false, // div
                        }],
                     }],
                  }],
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Content option with root for', function(done) {
               const html = '' +
                  '<WSUnit.resources.dirtyCheckingPatchTest>' +
                  '  <ws:contentTemplate>' +
                  '    <ws:for data="index, item in collection">' +
                  '      <div>{{ index }} x {{ item.name }}</div>' +
                  '    </ws:for>' +
                  '  </ws:contentTemplate>' +
                  '</WSUnit.resources.dirtyCheckingPatchTest>';
               const expectedAstFrame = [{
                  isContentOption: false, // Control 1
                  internal: {
                     '__dirtyCheckingVars_0': 'collection',
                  },
                  injectedData: [{
                     isContentOption: true, // Content option contentTemplate
                     internal: {
                        '__dirtyCheckingVars_0': 'collection',
                     },
                     children: [{
                        isContentOption: false, // for
                        children: [{
                           isContentOption: false, // div
                        }],
                     }],
                  }],
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Content option chain', function(done) {
               const html = '' +
                  '<WSUnit.resources.dirtyCheckingPatchTest>' +
                  '  <ws:contentTemplate>' +
                  '    <WSUnit.resources.dirtyCheckingPatchTest>' +
                  '      <ws:contentTemplate>' +
                  '        <WSUnit.resources.dirtyCheckingPatchTest>' +
                  '          <ws:contentTemplate>' +
                  '            <div>Hello, Wasaby!</div>' +
                  '          </ws:contentTemplate>' +
                  '        </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '      </ws:contentTemplate>' +
                  '    </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '  </ws:contentTemplate>' +
                  '</WSUnit.resources.dirtyCheckingPatchTest>';
               const expectedAstFrame = [{
                  isContentOption: false, // Control 1
                  internal: { },
                  injectedData: [{
                     isContentOption: true, // Content option contentTemplate 1
                     internal: { },
                     children: [{
                        isContentOption: false, // Control 2
                        internal: { },
                        injectedData: [{
                           isContentOption: true, // Content option contentTemplate 2
                           internal: { },
                           children: [{
                              isContentOption: false, // Control 3
                              internal: { },
                              injectedData: [{
                                 isContentOption: true, // Content option contentTemplate 3
                                 internal: { },
                                 children: [{
                                    isContentOption: false, // div
                                 }],
                              }],
                           }],
                        }],
                     }],
                  }],
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Content option', function(done) {
               const html = '' +
                  '<WSUnit.resources.dirtyCheckingPatchTest opt1="{{ opt1 }}" opt2="{{ opt2 }}" opt3="{{ opt3 }}">' +
                  '  <ws:contentTemplate>' +
                  '    <div>Hello, Wasaby!</div>' +
                  '  </ws:contentTemplate>' +
                  '</WSUnit.resources.dirtyCheckingPatchTest>';
               const expectedAstFrame = [{
                  isContentOption: false, // Control
                  internal: {
                     '__dirtyCheckingVars_0': 'opt1',
                     '__dirtyCheckingVars_1': 'opt2',
                     '__dirtyCheckingVars_2': 'opt3',
                  },
                  injectedData: [{
                     isContentOption: true, // Content option contentTemplate
                     internal: { },
                     children: [{
                        isContentOption: false, // div
                     }],
                  }],
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Content option chain with if', function(done) {
               const html = '' +
                  '<WSUnit.resources.dirtyCheckingPatchTest>' +
                  '  <ws:contentTemplate>' +
                  '    <ws:if data="{{ condition1 }}">' +
                  '      <WSUnit.resources.dirtyCheckingPatchTest>' +
                  '        <ws:contentTemplate>' +
                  '          <ws:if data="{{ condition2 }}">' +
                  '            <WSUnit.resources.dirtyCheckingPatchTest>' +
                  '              <ws:contentTemplate>' +
                  '                <ws:if data="{{ condition3 }}">' +
                  '                  <div>Hello, {{ name }}!</div>' +
                  '                </ws:if>' +
                  '                <ws:else>' +
                  '                  <div>Empty {{ level3 }}!</div>' +
                  '                </ws:else>' +
                  '              </ws:contentTemplate>' +
                  '            </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '          </ws:if>' +
                  '          <ws:else>' +
                  '            <div>Empty {{ level2 }}!</div>' +
                  '          </ws:else>' +
                  '        </ws:contentTemplate>' +
                  '      </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '    </ws:if>' +
                  '    <ws:else>' +
                  '      <div>Empty {{ level1 }}!</div>' +
                  '    </ws:else>' +
                  '  </ws:contentTemplate>' +
                  '</WSUnit.resources.dirtyCheckingPatchTest>';
               const expectedAstFrame = [{
                  isContentOption: false, // Control 1
                  internal: {
                     '__dirtyCheckingVars_0': 'name',
                     '__dirtyCheckingVars_1': 'condition3',
                     '__dirtyCheckingVars_2': 'level3',
                     '__dirtyCheckingVars_3': 'condition2',
                     '__dirtyCheckingVars_4': 'level2',
                     '__dirtyCheckingVars_5': 'condition1',
                     '__dirtyCheckingVars_6': 'level1',
                  },
                  injectedData: [{
                     isContentOption: true, // Content option contentTemplate 1
                     internal: {
                        '__dirtyCheckingVars_0': 'name',
                        '__dirtyCheckingVars_1': 'condition3',
                        '__dirtyCheckingVars_2': 'level3',
                        '__dirtyCheckingVars_3': 'condition2',
                        '__dirtyCheckingVars_4': 'level2',
                        '__dirtyCheckingVars_5': 'condition1',
                        '__dirtyCheckingVars_6': 'level1',
                     },
                     children: [{
                        isContentOption: false, // if
                        children: [{
                           isContentOption: false, // Control 2
                           internal: {
                              '__dirtyCheckingVars_0': 'name',
                              '__dirtyCheckingVars_1': 'condition3',
                              '__dirtyCheckingVars_2': 'level3',
                              '__dirtyCheckingVars_3': 'condition2',
                              '__dirtyCheckingVars_4': 'level2',
                           },
                           injectedData: [{
                              isContentOption: true, // Content option contentTemplate 2
                              internal: {
                                 '__dirtyCheckingVars_0': 'name',
                                 '__dirtyCheckingVars_1': 'condition3',
                                 '__dirtyCheckingVars_2': 'level3',
                                 '__dirtyCheckingVars_3': 'condition2',
                                 '__dirtyCheckingVars_4': 'level2',
                              },
                              children: [{
                                 isContentOption: false, // if
                                 children: [{
                                    isContentOption: false, // Control 3
                                    internal: {
                                       '__dirtyCheckingVars_0': 'name',
                                       '__dirtyCheckingVars_1': 'condition3',
                                       '__dirtyCheckingVars_2': 'level3',
                                    },
                                    injectedData: [{
                                       isContentOption: true, // Content option contentTemplate 3
                                       internal: {
                                          '__dirtyCheckingVars_0': 'name',
                                          '__dirtyCheckingVars_1': 'condition3',
                                          '__dirtyCheckingVars_2': 'level3',
                                       },
                                       children: [{
                                          isContentOption: false, // if
                                          children: [{
                                             isContentOption: false, // div
                                          }]
                                       }, {
                                          isContentOption: false, // else
                                          children: [{
                                             isContentOption: false, // div
                                          }],
                                       }],
                                    }],
                                 }],
                              }, {
                                 isContentOption: false, // else
                              }],
                           }],
                        }],
                     }, {
                        isContentOption: false, // else
                     }],
                  }],
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Content option chain with for', function(done) {
               const html = '' +
                  '<WSUnit.resources.dirtyCheckingPatchTest>' +
                  '  <ws:contentTemplate>' +
                  '    <ws:for data="index1, item1 in collection1">' +
                  '      <WSUnit.resources.dirtyCheckingPatchTest>' +
                  '        <ws:contentTemplate>' +
                  '          <ws:for data="index2, item2 in collection2">' +
                  '            <WSUnit.resources.dirtyCheckingPatchTest>' +
                  '              <ws:contentTemplate>' +
                  '                <ws:for data="index3, item3 in collection3">' +
                  '                  <div>{{ index1 }} x {{ item1.name }}</div>' +
                  '                  <div>{{ index2 }} x {{ item2.name }}</div>' +
                  '                  <div>{{ index3 }} x {{ item3.name }}</div>' +
                  '                </ws:for>' +
                  '              </ws:contentTemplate>' +
                  '            </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '          </ws:for>' +
                  '        </ws:contentTemplate>' +
                  '      </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '    </ws:for>' +
                  '  </ws:contentTemplate>' +
                  '</WSUnit.resources.dirtyCheckingPatchTest>';
               const expectedAstFrame = [{
                  isContentOption: false, // Control 1
                  internal: {
                     '__dirtyCheckingVars_0': 'collection1',
                     '__dirtyCheckingVars_1': 'collection2',
                     '__dirtyCheckingVars_2': 'collection3',
                  },
                  injectedData: [{
                     isContentOption: true, // Content option contentTemplate
                     internal: {
                        '__dirtyCheckingVars_0': 'collection1',
                        '__dirtyCheckingVars_1': 'collection2',
                        '__dirtyCheckingVars_2': 'collection3',
                     },
                     children: [{
                        isContentOption: false, // for
                        children: [{
                           isContentOption: false, // Control 2
                           internal: {
                              '__dirtyCheckingVars_0': 'collection2',
                              '__dirtyCheckingVars_1': 'collection3',
                              '__dirtyCheckingVars_2': 'index1',
                              '__dirtyCheckingVars_3': 'item1.name',
                           },
                           injectedData: [{
                              isContentOption: true, // Content option contentTemplate
                              internal: {
                                 '__dirtyCheckingVars_0': 'collection2',
                                 '__dirtyCheckingVars_1': 'collection3',
                                 '__dirtyCheckingVars_2': 'index1',
                                 '__dirtyCheckingVars_3': 'item1.name',
                              },
                              children: [{
                                 isContentOption: false, // for
                                 children: [{
                                    isContentOption: false, // Control 3
                                    internal: {
                                       '__dirtyCheckingVars_0': 'collection3',
                                       '__dirtyCheckingVars_1': 'index1',
                                       '__dirtyCheckingVars_2': 'item1.name',
                                       '__dirtyCheckingVars_3': 'index2',
                                       '__dirtyCheckingVars_4': 'item2.name',
                                    },
                                    injectedData: [{
                                       isContentOption: true, // Content option contentTemplate
                                       internal: {
                                          '__dirtyCheckingVars_0': 'collection3',
                                          '__dirtyCheckingVars_1': 'index1',
                                          '__dirtyCheckingVars_2': 'item1.name',
                                          '__dirtyCheckingVars_3': 'index2',
                                          '__dirtyCheckingVars_4': 'item2.name',
                                       },
                                       children: [{
                                          isContentOption: false, // for
                                          children: [{
                                             isContentOption: false, // div
                                          }, {
                                             isContentOption: false, // div
                                          }, {
                                             isContentOption: false, // div
                                          }],
                                       }],
                                    }],
                                 }],
                              }],
                           }],
                        }],
                     }],
                  }],
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Content option chain with for with scope intersection', function(done) {
               const html = '' +
                  '<WSUnit.resources.dirtyCheckingPatchTest>' +
                  '  <ws:contentTemplate>' +
                  '    <ws:for data="index1, item1 in collection1">' +
                  '      <ws:if data="{{ index1 < outerIndex1 }}">' +
                  '        <WSUnit.resources.dirtyCheckingPatchTest>' +
                  '          <ws:contentTemplate>' +
                  '            <ws:for data="index2, item2 in collection2">' +
                  '              <ws:if data="{{ index2 < index1 }}">' +
                  '                <WSUnit.resources.dirtyCheckingPatchTest>' +
                  '                  <ws:contentTemplate>' +
                  '                    <ws:for data="index3, item3 in collection3">' +
                  '                      <ws:if data="{{ index3 < index2 }}">' +
                  '                        <div>{{ index1 }} x {{ item1.name }}</div>' +
                  '                        <div>{{ index2 }} x {{ item2.name }}</div>' +
                  '                        <div>{{ index3 }} x {{ item3.name }}</div>' +
                  '                      </ws:if>' +
                  '                      <ws:else>' +
                  '                        <div>Empty {{ index3 }} in 3</div>' +
                  '                      </ws:else>' +
                  '                    </ws:for>' +
                  '                  </ws:contentTemplate>' +
                  '                </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '              </ws:if>' +
                  '              <ws:else>' +
                  '                <div>Empty {{ index2 }} in 2</div>' +
                  '              </ws:else>' +
                  '            </ws:for>' +
                  '          </ws:contentTemplate>' +
                  '        </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '      </ws:if>' +
                  '      <ws:else>' +
                  '        <div>Empty {{ index1 }} in 2</div>' +
                  '      </ws:else>' +
                  '    </ws:for>' +
                  '  </ws:contentTemplate>' +
                  '</WSUnit.resources.dirtyCheckingPatchTest>';
               const expectedAstFrame = [{
                  isContentOption: false, // Control 1
                  internal: {
                     '__dirtyCheckingVars_0': 'collection1',
                     '__dirtyCheckingVars_1': 'collection2',
                     '__dirtyCheckingVars_2': 'collection3',
                     "__dirtyCheckingVars_3": "outerIndex1",
                  },
                  injectedData: [{
                     isContentOption: true, // Content option contentTemplate 1
                     internal: {
                        '__dirtyCheckingVars_0': 'collection1',
                        '__dirtyCheckingVars_1': 'collection2',
                        '__dirtyCheckingVars_2': 'collection3',
                        "__dirtyCheckingVars_3": "outerIndex1",
                     },
                     children: [{
                        isContentOption: false, // for 1
                        children: [{
                           isContentOption: false, // if 1
                           children: [{
                              isContentOption: false, // Control 2
                              internal: {
                                 '__dirtyCheckingVars_0': 'collection2',
                                 '__dirtyCheckingVars_1': 'collection3',
                                 '__dirtyCheckingVars_2': 'index1',
                                 '__dirtyCheckingVars_3': 'item1.name',
                              },
                              injectedData: [{
                                 isContentOption: true, // Content option contentTemplate 2
                                 internal: {
                                    '__dirtyCheckingVars_0': 'collection2',
                                    '__dirtyCheckingVars_1': 'collection3',
                                    '__dirtyCheckingVars_2': 'index1',
                                    '__dirtyCheckingVars_3': 'item1.name',
                                 },
                                 children: [{
                                    isContentOption: false, // for 2
                                    children: [{
                                       isContentOption: false, // if 2
                                       children: [{
                                          isContentOption: false, // Control 3
                                          internal: {
                                             '__dirtyCheckingVars_0': 'collection3',
                                             '__dirtyCheckingVars_1': 'index1',
                                             '__dirtyCheckingVars_2': 'item1.name',
                                             '__dirtyCheckingVars_3': 'index2',
                                             '__dirtyCheckingVars_4': 'item2.name',
                                          },
                                          injectedData: [{
                                             isContentOption: true, // Content option contentTemplate 3
                                             internal: {
                                                '__dirtyCheckingVars_0': 'collection3',
                                                '__dirtyCheckingVars_1': 'index1',
                                                '__dirtyCheckingVars_2': 'item1.name',
                                                '__dirtyCheckingVars_3': 'index2',
                                                '__dirtyCheckingVars_4': 'item2.name',
                                             },
                                             children: [{
                                                isContentOption: false, // for 3
                                                children: [{
                                                   isContentOption: false, // if 3
                                                   children: [{
                                                      isContentOption: false, // div
                                                   }, {
                                                      isContentOption: false, // div
                                                   }, {
                                                      isContentOption: false, // div
                                                   }]
                                                }, {
                                                   isContentOption: false, // else 1
                                                }],
                                             }],
                                          }],
                                       }],
                                    }, {
                                       isContentOption: false, // else 1
                                    }],
                                 }],
                              }],
                           }],
                        }, {
                           isContentOption: false, // else 1
                        }],
                     }],
                  }],
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Getting data from content option with if', function(done) {
               const html = '' +
                  '<WSUnit.resources.dirtyCheckingPatchTest>' +
                  '  <ws:contentTemplate>' +
                  '    <ws:if data="{{ contentTemplate.condition && outerCondition }}">' +
                  '      <div>Hello, Wasaby!</div>' +
                  '    </ws:if>' +
                  '  </ws:contentTemplate>' +
                  '</WSUnit.resources.dirtyCheckingPatchTest>';
               const expectedAstFrame = [{
                  isContentOption: false, // Control 1
                  internal: {
                     "__dirtyCheckingVars_0": "outerCondition"
                  },
                  injectedData: [{
                     isContentOption: true, // Content option contentTemplate
                     internal: {
                        "__dirtyCheckingVars_0": "contentTemplate.condition && outerCondition"
                     },
                     children: [{
                        isContentOption: false, // if
                        children: [{
                           isContentOption: false, // div
                        }],
                     }],
                  }],
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Getting data from content option with if chained', function(done) {
               const html = '' +
                  '<WSUnit.resources.dirtyCheckingPatchTest>' +
                  '  <ws:contentTemplate>' +
                  '    <ws:if data="{{ contentTemplate.condition && outerCondition }}">' +
                  '      <WSUnit.resources.dirtyCheckingPatchTest>' +
                  '        <ws:contentTemplate>' +
                  '          <ws:if data="{{ contentTemplate.condition && outerCondition2 }}">' +
                  '            <WSUnit.resources.dirtyCheckingPatchTest>' +
                  '              <ws:contentTemplate>' +
                  '                <ws:if data="{{ contentTemplate.condition && outerCondition3 }}">' +
                  '                  <div>Hello, Wasaby!</div>' +
                  '                </ws:if>' +
                  '              </ws:contentTemplate>' +
                  '            </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '          </ws:if>' +
                  '        </ws:contentTemplate>' +
                  '      </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '    </ws:if>' +
                  '  </ws:contentTemplate>' +
                  '</WSUnit.resources.dirtyCheckingPatchTest>';
               const expectedAstFrame = [{
                  isContentOption: false, // Control 1
                  internal: {
                     "__dirtyCheckingVars_0": "outerCondition3",
                     "__dirtyCheckingVars_1": "outerCondition2",
                     "__dirtyCheckingVars_2": "outerCondition",
                  },
                  injectedData: [{
                     isContentOption: true, // Content option contentTemplate
                     internal: {
                        "__dirtyCheckingVars_0": "outerCondition3",
                        "__dirtyCheckingVars_1": "outerCondition2",
                        "__dirtyCheckingVars_2": "contentTemplate.condition && outerCondition"
                     },
                     children: [{
                        isContentOption: false, // if
                        children: [{
                           isContentOption: false, // Control 2
                           internal: {
                              "__dirtyCheckingVars_0": "outerCondition3",
                              "__dirtyCheckingVars_1": "outerCondition2",
                           },
                           injectedData: [{
                              isContentOption: true, // Content option contentTemplate
                              internal: {
                                 "__dirtyCheckingVars_0": "outerCondition3",
                                 "__dirtyCheckingVars_1": "contentTemplate.condition && outerCondition2",
                              },
                              children: [{
                                 isContentOption: false, // if
                                 children: [{
                                    isContentOption: false, // Control 3
                                    internal: {
                                       "__dirtyCheckingVars_0": "outerCondition3",
                                    },
                                    injectedData: [{
                                       isContentOption: true, // Content option contentTemplate
                                       internal: {
                                          "__dirtyCheckingVars_0": "contentTemplate.condition && outerCondition3"
                                       },
                                       children: [{
                                          isContentOption: false, // if
                                          children: [{
                                             isContentOption: false, // div
                                          }],
                                       }],
                                    }],
                                 }],
                              }],
                           }],
                        }],
                     }],
                  }],
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Getting data from content option with for', function(done) {
               const html = '' +
                  '<WSUnit.resources.dirtyCheckingPatchTest>' +
                  '  <ws:contentTemplate>' +
                  '    <ws:for data="index, item in contentTemplate.collection">' +
                  '      <div>Hello, #{{ index }} {{ item.name }}!</div>' +
                  '    </ws:for>' +
                  '  </ws:contentTemplate>' +
                  '</WSUnit.resources.dirtyCheckingPatchTest>';
               const expectedAstFrame = [{
                  isContentOption: false, // Control 1
                  internal: { },
                  injectedData: [{
                     isContentOption: true, // Content option contentTemplate
                     internal: {
                        "__dirtyCheckingVars_0": "contentTemplate.collection"
                     },
                     children: [{
                        isContentOption: false, // for
                        children: [{
                           isContentOption: false, // div
                        }],
                     }],
                  }],
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Getting data from content option with for chained', function(done) {
               const html = '' +
                  '<WSUnit.resources.dirtyCheckingPatchTest>' +
                  '  <ws:contentTemplate>' +
                  '    <ws:for data="index, item in contentTemplate.collection">' +
                  '      <WSUnit.resources.dirtyCheckingPatchTest>' +
                  '        <ws:contentTemplate>' +
                  '          <ws:for data="index, item in contentTemplate.collection">' +
                  '            <WSUnit.resources.dirtyCheckingPatchTest>' +
                  '              <ws:contentTemplate>' +
                  '                <ws:for data="index, item in contentTemplate.collection">' +
                  '                  <div>Hello, #{{ index }} {{ item.name }}!</div>' +
                  '                </ws:for>' +
                  '              </ws:contentTemplate>' +
                  '            </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '          </ws:for>' +
                  '        </ws:contentTemplate>' +
                  '      </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '    </ws:for>' +
                  '  </ws:contentTemplate>' +
                  '</WSUnit.resources.dirtyCheckingPatchTest>';
               const expectedAstFrame = [{
                  isContentOption: false, // Control 1
                  internal: { },
                  injectedData: [{
                     isContentOption: true, // Content option contentTemplate
                     internal: {
                        "__dirtyCheckingVars_0": "contentTemplate.collection"
                     },
                     children: [{
                        isContentOption: false, // for
                        children: [{
                           isContentOption: false, // Control 2
                           internal: { },
                           injectedData: [{
                              isContentOption: true, // Content option contentTemplate
                              internal: {
                                 "__dirtyCheckingVars_0": "contentTemplate.collection"
                              },
                              children: [{
                                 isContentOption: false, // for
                                 children: [{
                                    isContentOption: false, // Control 3
                                    internal: { },
                                    injectedData: [{
                                       isContentOption: true, // Content option contentTemplate
                                       internal: {
                                          "__dirtyCheckingVars_0": "contentTemplate.collection"
                                       },
                                       children: [{
                                          isContentOption: false, // for
                                          children: [{
                                             isContentOption: false, // div
                                          }],
                                       }],
                                    }],
                                 }],
                              }],
                           }],
                        }],
                     }],
                  }],
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Content in Object chained', function(done) {
               const html = '' +
                  '<WSUnit.resources.dirtyCheckingPatchTest opt1="{{ opt1 }}">' +
                  '  <ws:data>' +
                  '    <ws:Object>' +
                  '      <ws:contentTemplate>' +
                  '        <WSUnit.resources.dirtyCheckingPatchTest opt2="{{ opt2 }}">' +
                  '          <ws:data>' +
                  '            <ws:Object>' +
                  '              <ws:contentTemplate>' +
                  '                <WSUnit.resources.dirtyCheckingPatchTest opt3="{{ opt3 }}">' +
                  '                  <ws:data>' +
                  '                    <ws:Object>' +
                  '                      <ws:contentTemplate>' +
                  '                        <div>{{ message }}</div>' +
                  '                      </ws:contentTemplate>' +
                  '                    </ws:Object>' +
                  '                  </ws:data>' +
                  '                </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '              </ws:contentTemplate>' +
                  '            </ws:Object>' +
                  '          </ws:data>' +
                  '        </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '      </ws:contentTemplate>' +
                  '    </ws:Object>' +
                  '  </ws:data>' +
                  '</WSUnit.resources.dirtyCheckingPatchTest>';
               const expectedAstFrame = [{
                  isContentOption: false, // Control 1
                  internal: {
                     '__dirtyCheckingVars_0': 'message',
                     '__dirtyCheckingVars_1': 'opt3',
                     '__dirtyCheckingVars_2': 'opt2',
                     '__dirtyCheckingVars_3': 'opt1',
                  },
                  injectedData: [{
                     isContentOption: false, // data
                     children: [{
                        isContentOption: false, // Object
                        children: [{
                           isContentOption: true, // contentTemplate
                           internal: {
                              '__dirtyCheckingVars_0': 'message',
                              '__dirtyCheckingVars_1': 'opt3',
                              '__dirtyCheckingVars_2': 'opt2',
                           },
                           children: [{
                              isContentOption: false, // Control 2
                              internal: {
                                 '__dirtyCheckingVars_0': 'message',
                                 '__dirtyCheckingVars_1': 'opt3',
                              },
                              injectedData: [{
                                 isContentOption: false, // data
                                 children: [{
                                    isContentOption: false, // Object
                                    children: [{
                                       isContentOption: true, // contentTemplate
                                       internal: {
                                          '__dirtyCheckingVars_0': 'message',
                                          '__dirtyCheckingVars_1': 'opt3',
                                       },
                                       children: [{
                                          isContentOption: false, // Control 3
                                          internal: {
                                             '__dirtyCheckingVars_0': 'message',
                                          },
                                          injectedData: [{
                                             isContentOption: false, // data
                                             children: [{
                                                isContentOption: false, // Object
                                                children: [{
                                                   isContentOption: true, // contentTemplate
                                                   internal: {
                                                      '__dirtyCheckingVars_0': 'message',
                                                   },
                                                   children: [{
                                                      isContentOption: false, // div
                                                   }],
                                                }],
                                             }],
                                          }],
                                       }],
                                    }],
                                 }],
                              }],
                           }],
                        }],
                     }],
                  }],
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Bind expressions', function(done) {
               const html = '' +
                  '<WSUnit.resources.dirtyCheckingPatchTest bind:opt1="opt1.a1.b1.c1">' +
                  '  <ws:data>' +
                  '    <ws:Object>' +
                  '      <ws:contentTemplate>' +
                  '        <WSUnit.resources.dirtyCheckingPatchTest bind:opt2="opt2.a2[b2.c2]">' +
                  '          <ws:data>' +
                  '            <ws:Object>' +
                  '              <ws:contentTemplate>' +
                  '                <WSUnit.resources.dirtyCheckingPatchTest bind:opt3="opt3[a3.b3].c3">' +
                  '                  <ws:data>' +
                  '                    <ws:Object>' +
                  '                      <ws:contentTemplate>' +
                  '                        <div>{{ message }}</div>' +
                  '                      </ws:contentTemplate>' +
                  '                    </ws:Object>' +
                  '                  </ws:data>' +
                  '                </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '              </ws:contentTemplate>' +
                  '            </ws:Object>' +
                  '          </ws:data>' +
                  '        </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '      </ws:contentTemplate>' +
                  '    </ws:Object>' +
                  '  </ws:data>' +
                  '</WSUnit.resources.dirtyCheckingPatchTest>';
               const expectedAstFrame = [{
                  isContentOption: false, // Control 1
                  internal: {
                     "__dirtyCheckingVars_0": "message",
                     "__dirtyCheckingVars_1": "opt3[a3.b3]",
                     "__dirtyCheckingVars_2": "opt3[a3.b3].c3",
                     "__dirtyCheckingVars_3": "b2.c2",
                     "__dirtyCheckingVars_4": "opt2.a2[b2.c2]",
                     "__dirtyCheckingVars_5": "opt1.a1.b1",
                     "__dirtyCheckingVars_6": "opt1.a1.b1.c1"
                  },
                  injectedData: [{
                     isContentOption: false, // data
                     children: [{
                        isContentOption: false, // Object
                        children: [{
                           isContentOption: true, // contentTemplate
                           internal: {
                              "__dirtyCheckingVars_0": "message",
                              "__dirtyCheckingVars_1": "opt3[a3.b3]",
                              "__dirtyCheckingVars_2": "opt3[a3.b3].c3",
                              "__dirtyCheckingVars_3": "b2.c2",
                              "__dirtyCheckingVars_4": "opt2.a2[b2.c2]"
                           },
                           children: [{
                              isContentOption: false, // Control 2
                              internal: {
                                 "__dirtyCheckingVars_0": "message",
                                 "__dirtyCheckingVars_1": "opt3[a3.b3]",
                                 "__dirtyCheckingVars_2": "opt3[a3.b3].c3",
                                 "__dirtyCheckingVars_3": "b2.c2",
                                 "__dirtyCheckingVars_4": "opt2.a2[b2.c2]"
                              },
                              injectedData: [{
                                 isContentOption: false, // data
                                 children: [{
                                    isContentOption: false, // Object
                                    children: [{
                                       isContentOption: true, // contentTemplate
                                       internal: {
                                          "__dirtyCheckingVars_0": "message",
                                          "__dirtyCheckingVars_1": "opt3[a3.b3]",
                                          "__dirtyCheckingVars_2": "opt3[a3.b3].c3"
                                       },
                                       children: [{
                                          isContentOption: false, // Control 3
                                          internal: {
                                             "__dirtyCheckingVars_0": "message",
                                             "__dirtyCheckingVars_1": "opt3[a3.b3]",
                                             "__dirtyCheckingVars_2": "opt3[a3.b3].c3"
                                          },
                                          injectedData: [{
                                             isContentOption: false, // data
                                             children: [{
                                                isContentOption: false, // Object
                                                children: [{
                                                   isContentOption: true, // contentTemplate
                                                   internal: {
                                                      '__dirtyCheckingVars_0': 'message',
                                                   },
                                                   children: [{
                                                      isContentOption: false, // div
                                                   }],
                                                }],
                                             }],
                                          }],
                                       }],
                                    }],
                                 }],
                              }],
                           }],
                        }],
                     }],
                  }],
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Control with attributes of multiple types 1', function(done) {
               const html = '' +
                  '<div>' +
                  '  <WSUnit.resources.dirtyCheckingPatchTest  ' +
                  '                                            attr:prop1="{{ prop1 }}"' +
                  '                                            prop2="{{ prop21 }}text{{ prop22 }}text{{ prop23 }}"' +
                  '                                            attr:prop3="text{{ prop31 }}text{{ prop32 }}text{{ prop33 }}text"' +
                  '' +
                  '                                            prop4="{{ prop4 }}"' +
                  '                                            attr:prop5="{{ prop51 }}text{{ prop52 }}text{{ prop53 }}"' +
                  '                                            prop6="text{{ prop61 }}text{{ prop62 }}text{{ prop63 }}text"' +
                  '' +
                  '                                            bind:prop7="prop7"' +
                  '                                            on:click="handler8(prop81, true, prop82, \'string\', prop83[prop84][prop85])">' +
                  '' +
                  '  </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '</div>';
               const expectedAstFrame = [{
                  isContentOption: false, // div
                  internal: {
                     "__dirtyCheckingVars_0": "prop7",
                     "__dirtyCheckingVars_1": "prop21",
                     "__dirtyCheckingVars_2": "prop22",
                     "__dirtyCheckingVars_3": "prop23",
                     "__dirtyCheckingVars_4": "prop4",
                     "__dirtyCheckingVars_5": "prop61",
                     "__dirtyCheckingVars_6": "prop62",
                     "__dirtyCheckingVars_7": "prop63",
                     "__dirtyCheckingVars_8": "prop1",
                     "__dirtyCheckingVars_9": "prop31",
                     "__dirtyCheckingVars_10": "prop32",
                     "__dirtyCheckingVars_11": "prop33",
                     "__dirtyCheckingVars_12": "prop51",
                     "__dirtyCheckingVars_13": "prop52",
                     "__dirtyCheckingVars_14": "prop53"
                  },
                  children: [{
                     isContentOption: false, // Control 1
                     internal: {
                        '__dirtyCheckingVars_0': 'prop7'
                     }
                  }]
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Control with attributes of multiple types 2', function(done) {
               const html = '' +
                  '<div>' +
                  '  <WSUnit.resources.dirtyCheckingPatchTest  ' +
                  '                                            attr:prop1="{{ prop1 }}"' +
                  '                                            prop2="{{ prop21 }}text{{ prop22 }}text{{ prop23 }}"' +
                  '                                            attr:prop3="text{{ prop31 }}text{{ prop32 }}text{{ prop33 }}text"' +
                  '' +
                  '                                            prop4="{{ prop4 }}"' +
                  '                                            attr:prop5="{{ prop51 }}text{{ prop52 }}text{{ prop53 }}"' +
                  '                                            prop6="text{{ prop61 }}text{{ prop62 }}text{{ prop63 }}text"' +
                  '' +
                  '                                            bind:prop7="prop7"' +
                  '                                            on:click1="handler8(prop81, true, prop82, \'string\', prop83[prop84][prop85])"' +
                  '' +
                  '                                            attr:prop9="{{ prop9 }}"' +
                  '                                            prop10="{{ prop101 }}text{{ prop102 }}text{{ prop103 }}"' +
                  '                                            attr:prop11="text{{ prop111 }}text{{ prop112 }}text{{ prop113 }}text"' +
                  '' +
                  '                                            prop12="{{ prop12 }}"' +
                  '                                            attr:prop13="{{ prop131 }}text{{ prop132 }}text{{ prop133 }}"' +
                  '                                            prop14="text{{ prop141 }}text{{ prop142 }}text{{ prop143 }}text"' +
                  '' +
                  '                                            bind:prop15="prop15"' +
                  '                                            on:click2="handler16(prop161, true, prop162, \'string\', prop163[prop164][prop165])">' +
                  '' +
                  '  </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '</div>';
               const expectedAstFrame = [{
                  isContentOption: false, // div
                  internal: {
                     "__dirtyCheckingVars_0": "prop7",
                     "__dirtyCheckingVars_1": "prop15",
                     "__dirtyCheckingVars_2": "prop21",
                     "__dirtyCheckingVars_3": "prop22",
                     "__dirtyCheckingVars_4": "prop23",
                     "__dirtyCheckingVars_5": "prop4",
                     "__dirtyCheckingVars_6": "prop61",
                     "__dirtyCheckingVars_7": "prop62",
                     "__dirtyCheckingVars_8": "prop63",
                     "__dirtyCheckingVars_9": "prop101",
                     "__dirtyCheckingVars_10": "prop102",
                     "__dirtyCheckingVars_11": "prop103",
                     "__dirtyCheckingVars_12": "prop12",
                     "__dirtyCheckingVars_13": "prop141",
                     "__dirtyCheckingVars_14": "prop142",
                     "__dirtyCheckingVars_15": "prop143",
                     "__dirtyCheckingVars_16": "prop1",
                     "__dirtyCheckingVars_17": "prop31",
                     "__dirtyCheckingVars_18": "prop32",
                     "__dirtyCheckingVars_19": "prop33",
                     "__dirtyCheckingVars_20": "prop51",
                     "__dirtyCheckingVars_21": "prop52",
                     "__dirtyCheckingVars_22": "prop53",
                     "__dirtyCheckingVars_23": "prop9",
                     "__dirtyCheckingVars_24": "prop111",
                     "__dirtyCheckingVars_25": "prop112",
                     "__dirtyCheckingVars_26": "prop113",
                     "__dirtyCheckingVars_27": "prop131",
                     "__dirtyCheckingVars_28": "prop132",
                     "__dirtyCheckingVars_29": "prop133"
                  },
                  children: [{
                     isContentOption: false, // Control 1
                     internal: {
                        '__dirtyCheckingVars_0': 'prop7',
                        '__dirtyCheckingVars_1': 'prop15'
                     }
                  }]
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Control with attributes of multiple types 3', function(done) {
               const html = '' +
                  '<div>' +
                  '  <WSUnit.resources.dirtyCheckingPatchTest  ' +
                  '                                            attr:prop1="text{{ prop11 }}text{{ prop12 }}text{{ prop13 }}text"' +
                  '                                            prop2="text{{ prop21 }}text{{ prop22 }}text{{ prop23 }}text"' +
                  '' +
                  '                                            bind:prop3="prop3"' +
                  '                                            on:click="handler4(prop41, true, prop42, \'string\', prop43[prop44][prop45])">' +
                  '' +
                  '  </WSUnit.resources.dirtyCheckingPatchTest>' +
                  '</div>';
               const expectedAstFrame = [{
                  isContentOption: false, // div
                  internal: {
                     "__dirtyCheckingVars_0": "prop3",
                     "__dirtyCheckingVars_1": "prop21",
                     "__dirtyCheckingVars_2": "prop22",
                     "__dirtyCheckingVars_3": "prop23",
                     "__dirtyCheckingVars_4": "prop11",
                     "__dirtyCheckingVars_5": "prop12",
                     "__dirtyCheckingVars_6": "prop13"
                  },
                  children: [{
                     isContentOption: false, // Control 1
                     internal: {
                        '__dirtyCheckingVars_0': 'prop3'
                     }
                  }]
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Directive ws:template', function(done) {
               const html = '' +
                  '<ws:template name="tmpl">' +
                  '  <div>{{ value }}</div>' +
                  '</ws:template>' +
                  '<div>' +
                  '  <ws:partial template="tmpl"' +
                  '              attr:prop1="{{ prop1 }}"' +
                  '              attr:prop2="{{ prop21 }}text{{ prop22 }}text{{ prop23 }}"' +
                  '              attr:prop3="text{{ prop31 }}text{{ prop32 }}text{{ prop33 }}text"' +
                  '' +
                  '              prop4="{{ prop4 }}"' +
                  '              prop5="{{ prop51 }}text{{ prop52 }}text{{ prop53 }}"' +
                  '              prop6="text{{ prop61 }}text{{ prop62 }}text{{ prop63 }}text"' +
                  '' +
                  '              bind:prop7="prop7"' +
                  '              on:click="handler8(prop81, true, prop82, \'string\', prop83[prop84][prop85])">' +
                  '' +
                  '  </ws:partial>' +
                  '</div>';

               const expectedAstFrame = [{
                  isContentOption: false, // ws:template
                  internal: {
                     '__dirtyCheckingVars_0': 'value'
                  },
                  children: [{
                     isContentOption: false // div
                  }]
               }, {
                  isContentOption: false, // div
                  internal: {
                     "__dirtyCheckingVars_0": "value",
                     "__dirtyCheckingVars_1": "prop7",
                     "__dirtyCheckingVars_2": "prop4",
                     "__dirtyCheckingVars_3": "prop51",
                     "__dirtyCheckingVars_4": "prop52",
                     "__dirtyCheckingVars_5": "prop53",
                     "__dirtyCheckingVars_6": "prop61",
                     "__dirtyCheckingVars_7": "prop62",
                     "__dirtyCheckingVars_8": "prop63",
                     "__dirtyCheckingVars_9": "prop1",
                     "__dirtyCheckingVars_10": "prop21",
                     "__dirtyCheckingVars_11": "prop22",
                     "__dirtyCheckingVars_12": "prop23",
                     "__dirtyCheckingVars_13": "prop31",
                     "__dirtyCheckingVars_14": "prop32",
                     "__dirtyCheckingVars_15": "prop33"
                  },
                  children: [{
                     isContentOption: false, // ws:partial
                     internal: {
                        '__dirtyCheckingVars_0': 'value',
                        '__dirtyCheckingVars_1': 'prop7'
                     }
                  }]
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Directive ws:template 2', function(done) {
               const html = '' +
                  '<ws:template name="tmpl">' +
                  '  <div>\n' +
                  '    <span>{{ option1.getValue() }}</span>' +
                  '    <span>{{ option2.getValue() }}</span>' +
                  '    <span>{{ option3.getValue() }}</span>' +
                  '  </div>' +
                  '</ws:template>' +
                  '' +
                  '<ws:partial ' +
                  '      template="tmpl"' +
                  '      option1="{{ option1 }}"' +
                  '      option2="{{ _options.option2 }}"' +
                  '      option3="{{ item.getOption(\'id-123\') }}"' +
                  '/>';
               const expectedAstFrame = [{
                  isContentOption: false, // ws:template
                  internal: {
                     '__dirtyCheckingVars_0': 'option1.getValue()',
                     '__dirtyCheckingVars_1': 'option2.getValue()',
                     '__dirtyCheckingVars_2': 'option3.getValue()',
                  },
                  children: [{
                     isContentOption: false, // div
                     children: [{
                        isContentOption: false // span 1
                     }, {
                        isContentOption: false // span 2
                     }, {
                        isContentOption: false // span 3
                     }]
                  }]
               }, {
                  isContentOption: false, // ws:partial
                  internal: {
                     '__dirtyCheckingVars_0': 'option1.getValue()',
                     '__dirtyCheckingVars_1': 'option1',
                     '__dirtyCheckingVars_2': '_options.option2',
                     '__dirtyCheckingVars_3': 'item.getOption(\'id-123\')',
                  }
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('Directive ws:template 3', function(done) {
               const html = '' +
                  '<ws:template name="tmpl">' +
                  '  <div>\n' +
                  '    <span>{{ option1.getValue() }}</span>' +
                  '    <span>{{ option2.name }} {{ option5.message }}</span>' +
                  '    <span>{{ option3 + option4 }}</span>' +
                  '  </div>' +
                  '</ws:template>' +
                  '' +
                  '<ws:partial ' +
                  '      template="tmpl"' +
                  '      bind:option1="option1"' +
                  '      option2="{{ option21 }}+{{ option22 }}"' +
                  '      option3="{{ getValue(\'!option3\') }}"' +
                  '/>';
               const expectedAstFrame = [{
                  isContentOption: false, // ws:template
                  internal: {
                     '__dirtyCheckingVars_0': 'option1.getValue()',
                     '__dirtyCheckingVars_1': 'option2.name',
                     '__dirtyCheckingVars_2': 'option5.message',
                     '__dirtyCheckingVars_3': 'option3 + option4',
                  },
                  children: [{
                     isContentOption: false, // div
                     children: [{
                        isContentOption: false // span 1
                     }, {
                        isContentOption: false // span 2
                     }, {
                        isContentOption: false // span 3
                     }]
                  }]
               }, {
                  isContentOption: false, // ws:partial
                  internal: {
                     "__dirtyCheckingVars_0": "option1.getValue()",
                     "__dirtyCheckingVars_1": "option5.message",
                     "__dirtyCheckingVars_2": "option4",
                     "__dirtyCheckingVars_3": "option1",
                     "__dirtyCheckingVars_4": "option21",
                     "__dirtyCheckingVars_5": "option22",
                     "__dirtyCheckingVars_6": "getValue('!option3')"
                  }
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('dynamic ws:partial with attributes of multiple types 1', function(done) {
               const html = '' +
                  '<div>' +
                  '  <ws:partial template="{{ tmpl }}" ' +
                  '                                            attr:prop1="{{ prop1 }}"' +
                  '                                            prop2="{{ prop21 }}text{{ prop22 }}text{{ prop23 }}"' +
                  '                                            attr:prop3="text{{ prop31 }}text{{ prop32 }}text{{ prop33 }}text"' +
                  '' +
                  '                                            prop4="{{ prop4 }}"' +
                  '                                            attr:prop5="{{ prop51 }}text{{ prop52 }}text{{ prop53 }}"' +
                  '                                            prop6="text{{ prop61 }}text{{ prop62 }}text{{ prop63 }}text"' +
                  '' +
                  '                                            bind:prop7="prop7"' +
                  '                                            on:click="handler8(prop81, true, prop82, \'string\', prop83[prop84][prop85])">' +
                  '' +
                  '  </ws:partial>' +
                  '</div>';
               const expectedAstFrame = [{
                  isContentOption: false, // div
                  internal: {
                     "__dirtyCheckingVars_0": "prop7",
                     "__dirtyCheckingVars_1": "prop21",
                     "__dirtyCheckingVars_2": "prop22",
                     "__dirtyCheckingVars_3": "prop23",
                     "__dirtyCheckingVars_4": "prop4",
                     "__dirtyCheckingVars_5": "prop61",
                     "__dirtyCheckingVars_6": "prop62",
                     "__dirtyCheckingVars_7": "prop63",
                     "__dirtyCheckingVars_8": "prop1",
                     "__dirtyCheckingVars_9": "prop31",
                     "__dirtyCheckingVars_10": "prop32",
                     "__dirtyCheckingVars_11": "prop33",
                     "__dirtyCheckingVars_12": "prop51",
                     "__dirtyCheckingVars_13": "prop52",
                     "__dirtyCheckingVars_14": "prop53",
                     "__dirtyCheckingVars_15": "tmpl"
                  },
                  children: [{
                     isContentOption: false, // ws:partial
                     internal: {
                        '__dirtyCheckingVars_0': 'prop7'
                     }
                  }]
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
            it('dynamic ws:partial with attributes of multiple types 2', function(done) {
               const html = '' +
                  '<div>' +
                  '  <ws:partial template="{{ tmpl }}"' +
                  '                                            attr:prop1="{{ prop1 }}"' +
                  '                                            prop2="{{ prop21 }}text{{ prop22 }}text{{ prop23 }}"' +
                  '                                            attr:prop3="text{{ prop31 }}text{{ prop32 }}text{{ prop33 }}text"' +
                  '' +
                  '                                            prop4="{{ prop4 }}"' +
                  '                                            attr:prop5="{{ prop51 }}text{{ prop52 }}text{{ prop53 }}"' +
                  '                                            prop6="text{{ prop61 }}text{{ prop62 }}text{{ prop63 }}text"' +
                  '' +
                  '                                            bind:prop7="prop7"' +
                  '                                            on:click1="handler8(prop81, true, prop82, \'string\', prop83[prop84][prop85])"' +
                  '' +
                  '                                            attr:prop9="{{ prop9 }}"' +
                  '                                            prop10="{{ prop101 }}text{{ prop102 }}text{{ prop103 }}"' +
                  '                                            attr:prop11="text{{ prop111 }}text{{ prop112 }}text{{ prop113 }}text"' +
                  '' +
                  '                                            prop12="{{ prop12 }}"' +
                  '                                            attr:prop13="{{ prop131 }}text{{ prop132 }}text{{ prop133 }}"' +
                  '                                            prop14="text{{ prop141 }}text{{ prop142 }}text{{ prop143 }}text"' +
                  '' +
                  '                                            bind:prop15="prop15"' +
                  '                                            on:click2="handler16(prop161, true, prop162, \'string\', prop163[prop164][prop165])">' +
                  '' +
                  '  </ws:partial>' +
                  '</div>';
               const expectedAstFrame = [{
                  isContentOption: false, // div
                  internal: {
                     "__dirtyCheckingVars_0": "prop7",
                     "__dirtyCheckingVars_1": "prop15",
                     "__dirtyCheckingVars_2": "prop21",
                     "__dirtyCheckingVars_3": "prop22",
                     "__dirtyCheckingVars_4": "prop23",
                     "__dirtyCheckingVars_5": "prop4",
                     "__dirtyCheckingVars_6": "prop61",
                     "__dirtyCheckingVars_7": "prop62",
                     "__dirtyCheckingVars_8": "prop63",
                     "__dirtyCheckingVars_9": "prop101",
                     "__dirtyCheckingVars_10": "prop102",
                     "__dirtyCheckingVars_11": "prop103",
                     "__dirtyCheckingVars_12": "prop12",
                     "__dirtyCheckingVars_13": "prop141",
                     "__dirtyCheckingVars_14": "prop142",
                     "__dirtyCheckingVars_15": "prop143",
                     "__dirtyCheckingVars_16": "prop1",
                     "__dirtyCheckingVars_17": "prop31",
                     "__dirtyCheckingVars_18": "prop32",
                     "__dirtyCheckingVars_19": "prop33",
                     "__dirtyCheckingVars_20": "prop51",
                     "__dirtyCheckingVars_21": "prop52",
                     "__dirtyCheckingVars_22": "prop53",
                     "__dirtyCheckingVars_23": "prop9",
                     "__dirtyCheckingVars_24": "prop111",
                     "__dirtyCheckingVars_25": "prop112",
                     "__dirtyCheckingVars_26": "prop113",
                     "__dirtyCheckingVars_27": "prop131",
                     "__dirtyCheckingVars_28": "prop132",
                     "__dirtyCheckingVars_29": "prop133",
                     "__dirtyCheckingVars_30": "tmpl"
                  },
                  children: [{
                     isContentOption: false, // ws:partial
                     internal: {
                        '__dirtyCheckingVars_0': 'prop7',
                        '__dirtyCheckingVars_1': 'prop15'
                     }
                  }]
               }];
               getAst(html).then(function callback(tree) {
                  try {
                     checkTree(tree, expectedAstFrame);
                     done();
                  } catch (error) {
                     done(error);
                  }
               }, function errback(error) {
                  done(error);
               });
            });
         });
      });
   });
});
