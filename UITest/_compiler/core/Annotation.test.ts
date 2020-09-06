import { Tmpl, Config } from 'UI/Builder';
import { assert } from 'chai';

// TODO: UI/_builder/Tmpl/* -> Compiler/*

const FILE_NAME = 'Compiler/core/Annotation/Template.wml';

function stringifyInternal(internal) {
   let r = { };
   Object.keys(internal).forEach(function(p) {
      r[p] = internal[p].data[0].name.string;
   });
   return JSON.stringify(r, undefined, ' ');
}

function checkTreeRecursive(ast, expectedAstFrame) {
   let idx, name, expIntStr, actIntStr;
   expIntStr = expectedAstFrame.internal ? JSON.stringify(expectedAstFrame.internal, undefined, ' ') : 'None';
   actIntStr = ast.internal ? stringifyInternal(ast.internal) : 'None';

   // Проверяем набор служебных выражений
   assert.strictEqual(!!ast.internal, !!expectedAstFrame.internal,
      '(Un)Expected internal set.' +
      'Expected: ' + expIntStr +
      'But got: ' + actIntStr +
      'At ast node "' + ast.name + '"');
   if (expectedAstFrame.internal) {
      let names = Object.keys(expectedAstFrame.internal);
      assert.strictEqual(Object.keys(ast.internal).length, names.length,
         'Internal sets are not equal.' +
         'Expected: ' + expIntStr +
         'But got: ' + actIntStr +
         'At ast node "' + ast.name + '"');
      for (idx = 0; idx < names.length; ++idx) {
         name = names[idx];
         assert.strictEqual(
            expectedAstFrame.internal[name].replace(/\s/g, ''),
            ast.internal[name].data[0].name.string.replace(/\s/g, ''),
            'Values are not equal for internal.' +
            'Expected: ' + expIntStr +
            'But got: ' + actIntStr +
            'At ast node "' + ast.name + '"'
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

function checkTree(tree, expectedAstFrame) {
   let index;
   for (index = 0; index < expectedAstFrame.length; ++index) {
      checkTreeRecursive(tree[index], expectedAstFrame[index]);
   }
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
         const tmpl = Tmpl.template(html, (path) => `tmpl!${path}`, buildConfig);
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

function getAst(html) {
   return new Promise(function(resolve, reject) {
      const config = {
         config: Config,
         fileName: FILE_NAME,
         componentsProperties: { },
         fromBuilderTmpl: true,
         createResultDictionary: false
      };
      buildAST(html, config)
         .then(function(artifact) {
            // @ts-ignore
            resolve(artifact.ast);
         })
         .catch(function(error) {
            reject(error);
         });
   });
}

describe('Compiler/core/Annotation', () => {
   describe('Reactive properties', () => {
      describe('Elements', () => {
         it('Validate reactive properties for primitives', (done) => {
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
         it('Elements only', (done) => {
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
         it('Cycle foreach chain', (done) => {
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
         it('Cycle for #1', (done) => {
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
                  '__dirtyCheckingVars_0': 'a3',
                  '__dirtyCheckingVars_1': 'a2',
                  '__dirtyCheckingVars_2': 'a1'
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
         it('Cycle for #2', (done) => {
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
                  '__dirtyCheckingVars_0': 'a3',
                  '__dirtyCheckingVars_1': 'b3',
                  '__dirtyCheckingVars_2': 'c3',
                  '__dirtyCheckingVars_3': 'a2',
                  '__dirtyCheckingVars_4': 'b2',
                  '__dirtyCheckingVars_5': 'c2',
                  '__dirtyCheckingVars_6': 'a1',
                  '__dirtyCheckingVars_7': 'b1',
                  '__dirtyCheckingVars_8': 'c1'
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
         it('If chain', (done) => {
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
         it('Foreach with scope intersection', (done) => {
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
         it('For with scope intersection #1', (done) => {
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
                  '__dirtyCheckingVars_0': 'outerIndex2',
                  '__dirtyCheckingVars_1': 'a3',
                  '__dirtyCheckingVars_2': 'index1',
                  '__dirtyCheckingVars_3': 'a2',
                  '__dirtyCheckingVars_4': 'outerIndex',
                  '__dirtyCheckingVars_5': 'a1',
                  '__dirtyCheckingVars_6': 'condition1'
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
         it('Controls chain and div in content', (done) => {
            const html = '' +
               '<WSUnit.resources.dirtyCheckingPatchTest a="{{ a }}">' +
               '  <WSUnit.resources.dirtyCheckingPatchTest b="{{ b }}">' +
               '    <WSUnit.resources.dirtyCheckingPatchTest c="{{ c }}">' +
               '      <WSUnit.resources.dirtyCheckingPatchTest d="{{ d }}">' +
               '        <div>{{ message }}</div>' +
               '      </WSUnit.resources.dirtyCheckingPatchTest>' +
               '    </WSUnit.resources.dirtyCheckingPatchTest>' +
               '  </WSUnit.resources.dirtyCheckingPatchTest>' +
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
                  isContentOption: false, // Control 2
                  internal: {
                     '__dirtyCheckingVars_0': 'message',
                     '__dirtyCheckingVars_1': 'd',
                     '__dirtyCheckingVars_2': 'c',
                  },
                  injectedData: [{
                     isContentOption: false, // Control 3
                     internal: {
                        '__dirtyCheckingVars_0': 'message',
                        '__dirtyCheckingVars_1': 'd',
                     },
                     injectedData: [{
                        isContentOption: false, // Control 4
                        internal: {
                           '__dirtyCheckingVars_0': 'message',
                        },
                        injectedData: [{
                           isContentOption: false, // div
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
         it('Controls chain and if in content', (done) => {
            const html = '' +
               '<WSUnit.resources.dirtyCheckingPatchTest a="{{ a }}">' +
               '  <WSUnit.resources.dirtyCheckingPatchTest b="{{ b }}">' +
               '    <WSUnit.resources.dirtyCheckingPatchTest c="{{ c }}">' +
               '      <WSUnit.resources.dirtyCheckingPatchTest d="{{ d }}">' +
               '        <ws:if data="{{ condition }}">' +
               '          <div>{{ conditionalData }}</div>' +
               '        </ws:if>' +
               '      </WSUnit.resources.dirtyCheckingPatchTest>' +
               '    </WSUnit.resources.dirtyCheckingPatchTest>' +
               '  </WSUnit.resources.dirtyCheckingPatchTest>' +
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
                  isContentOption: false, // Control 2
                  internal: {
                     '__dirtyCheckingVars_0': 'conditionalData',
                     '__dirtyCheckingVars_1': 'condition',
                     '__dirtyCheckingVars_2': 'd',
                     '__dirtyCheckingVars_3': 'c',
                  },
                  injectedData: [{
                     isContentOption: false, // Control 3
                     internal: {
                        '__dirtyCheckingVars_0': 'conditionalData',
                        '__dirtyCheckingVars_1': 'condition',
                        '__dirtyCheckingVars_2': 'd',
                     },
                     injectedData: [{
                        isContentOption: false, // Control 4
                        internal: {
                           '__dirtyCheckingVars_0': 'conditionalData',
                           '__dirtyCheckingVars_1': 'condition',
                        },
                        injectedData: [{
                           isContentOption: false, // ws:if
                           children: [{
                              isContentOption: false, // div
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
         it('Controls chain and for in content', (done) => {
            const html = '' +
               '<WSUnit.resources.dirtyCheckingPatchTest a="{{ a }}">' +
               '  <WSUnit.resources.dirtyCheckingPatchTest b="{{ b }}">' +
               '    <WSUnit.resources.dirtyCheckingPatchTest c="{{ c }}">' +
               '      <WSUnit.resources.dirtyCheckingPatchTest d="{{ d }}">' +
               '        <ws:for data="item in collection">' +
               '          <div>{{ item.name }}</div>' +
               '        </ws:for>' +
               '      </WSUnit.resources.dirtyCheckingPatchTest>' +
               '    </WSUnit.resources.dirtyCheckingPatchTest>' +
               '  </WSUnit.resources.dirtyCheckingPatchTest>' +
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
                  isContentOption: false, // Control 2
                  internal: {
                     '__dirtyCheckingVars_0': 'collection',
                     '__dirtyCheckingVars_1': 'd',
                     '__dirtyCheckingVars_2': 'c',
                  },
                  injectedData: [{
                     isContentOption: false, // Control 3
                     internal: {
                        '__dirtyCheckingVars_0': 'collection',
                        '__dirtyCheckingVars_1': 'd',
                     },
                     injectedData: [{
                        isContentOption: false, // Control 4
                        internal: {
                           '__dirtyCheckingVars_0': 'collection',
                        },
                        injectedData: [{
                           isContentOption: false, // ws:for
                           children: [{
                              isContentOption: false, // div
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
         it('Controls chain with conditions', (done) => {
            const html = '' +
               '<WSUnit.resources.dirtyCheckingPatchTest if="{{ cond1 }}" a="{{ a }}">' +
               '  <WSUnit.resources.dirtyCheckingPatchTest if="{{ cond2 }}" b="{{ b }}">' +
               '    <WSUnit.resources.dirtyCheckingPatchTest if="{{ cond3 }}" c="{{ c }}">' +
               '      <WSUnit.resources.dirtyCheckingPatchTest if="{{ cond4 }}" d="{{ d }}">' +
               '        <div if="{{ cond5 }}">{{ message }}</div>' +
               '      </WSUnit.resources.dirtyCheckingPatchTest>' +
               '    </WSUnit.resources.dirtyCheckingPatchTest>' +
               '  </WSUnit.resources.dirtyCheckingPatchTest>' +
               '</WSUnit.resources.dirtyCheckingPatchTest>';
            const expectedAstFrame = [{
               isContentOption: false, // Control 1
               internal: {
                  '__dirtyCheckingVars_0': 'message',
                  '__dirtyCheckingVars_1': 'cond5',
                  '__dirtyCheckingVars_2': 'cond4',
                  '__dirtyCheckingVars_3': 'd',
                  '__dirtyCheckingVars_4': 'cond3',
                  '__dirtyCheckingVars_5': 'c',
                  '__dirtyCheckingVars_6': 'cond2',
                  '__dirtyCheckingVars_7': 'b',
                  '__dirtyCheckingVars_8': 'cond1',
                  '__dirtyCheckingVars_9': 'a'
               },
               injectedData: [{
                  isContentOption: false, // Control 2
                  internal: {
                     '__dirtyCheckingVars_0': 'message',
                     '__dirtyCheckingVars_1': 'cond5',
                     '__dirtyCheckingVars_2': 'cond4',
                     '__dirtyCheckingVars_3': 'd',
                     '__dirtyCheckingVars_4': 'cond3',
                     '__dirtyCheckingVars_5': 'c',
                  },
                  injectedData: [{
                     isContentOption: false, // Control 3
                     internal: {
                        '__dirtyCheckingVars_0': 'message',
                        '__dirtyCheckingVars_1': 'cond5',
                        '__dirtyCheckingVars_2': 'cond4',
                        '__dirtyCheckingVars_3': 'd',
                     },
                     injectedData: [{
                        isContentOption: false, // Control 4
                        internal: {
                           '__dirtyCheckingVars_0': 'message',
                           '__dirtyCheckingVars_1': 'cond5',
                        },
                        injectedData: [{
                           isContentOption: false, // div
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
         it('Controls chain with cycles', (done) => {
            const html = '' +
               '<WSUnit.resources.dirtyCheckingPatchTest  a="{{ a }}">' +
               '  <WSUnit.resources.dirtyCheckingPatchTest b="{{ b }}">' +
               '    <WSUnit.resources.dirtyCheckingPatchTest c="{{ c }}">' +
               '      <WSUnit.resources.dirtyCheckingPatchTest d="{{ d }}">' +
               '        <div for="id1, item1 in coll1">{{ message }}</div>' +
               '      </WSUnit.resources.dirtyCheckingPatchTest>' +
               '    </WSUnit.resources.dirtyCheckingPatchTest>' +
               '  </WSUnit.resources.dirtyCheckingPatchTest>' +
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
                  isContentOption: false, // Control 2
                  internal: {
                     '__dirtyCheckingVars_0': 'coll1',
                     '__dirtyCheckingVars_1': 'message',
                     '__dirtyCheckingVars_2': 'd',
                     '__dirtyCheckingVars_3': 'c',
                  },
                  injectedData: [{
                     isContentOption: false, // Control 3
                     internal: {
                        '__dirtyCheckingVars_0': 'coll1',
                        '__dirtyCheckingVars_1': 'message',
                        '__dirtyCheckingVars_2': 'd',
                     },
                     injectedData: [{
                        isContentOption: false, // Control 4
                        internal: {
                           '__dirtyCheckingVars_0': 'coll1',
                           '__dirtyCheckingVars_1': 'message',
                        },
                        injectedData: [{
                           isContentOption: false, // div
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
         it('Controls chain with cycles in div', (done) => {
            const html = '' +
               '<div>' +
               '  <WSUnit.resources.dirtyCheckingPatchTest a="{{ a }}">' +
               '    <div>' +
               '      <WSUnit.resources.dirtyCheckingPatchTest b="{{ b }}">' +
               '        <div>' +
               '          <WSUnit.resources.dirtyCheckingPatchTest c="{{ c }}">' +
               '            <div>' +
               '              <WSUnit.resources.dirtyCheckingPatchTest d="{{ d }}">' +
               '                <div for="id1, item1 in coll1">{{ message }}</div>' +
               '              </WSUnit.resources.dirtyCheckingPatchTest>' +
               '            </div>' +
               '          </WSUnit.resources.dirtyCheckingPatchTest>' +
               '        </div>' +
               '      </WSUnit.resources.dirtyCheckingPatchTest>' +
               '    </div>' +
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
                           isContentOption: false, // div 3
                           children: [{
                              isContentOption: false, // Control 3
                              internal: {
                                 '__dirtyCheckingVars_0': 'coll1',
                                 '__dirtyCheckingVars_1': 'message',
                                 '__dirtyCheckingVars_2': 'd',
                              },
                              injectedData: [{
                                 isContentOption: false, // div 4
                                 children: [{
                                    isContentOption: false, // Control 4
                                    internal: {
                                       '__dirtyCheckingVars_0': 'coll1',
                                       '__dirtyCheckingVars_1': 'message',
                                    },
                                    injectedData: [{
                                       isContentOption: false, // div 5 (for)
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
         it('Content option with data', (done) => {
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
         it('Content option with root simple markup', (done) => {
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
         it('Content option with root if', (done) => {
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
         it('Content option with root for', (done) => {
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
         it('Content option chain', (done) => {
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
         it('Content option', (done) => {
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
         it('Content option chain with if', (done) => {
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
         it('Content option chain with for', (done) => {
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
         it('Content option chain with for with scope intersection', (done) => {
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
                              "__dirtyCheckingVars_4": "index1",
                           },
                           injectedData: [{
                              isContentOption: true, // Content option contentTemplate 2
                              internal: {
                                 '__dirtyCheckingVars_0': 'collection2',
                                 '__dirtyCheckingVars_1': 'collection3',
                                 '__dirtyCheckingVars_2': 'index1',
                                 '__dirtyCheckingVars_3': 'item1.name',
                                 "__dirtyCheckingVars_4": "index1",
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
                                          "__dirtyCheckingVars_5": "index2",
                                       },
                                       injectedData: [{
                                          isContentOption: true, // Content option contentTemplate 3
                                          internal: {
                                             '__dirtyCheckingVars_0': 'collection3',
                                             '__dirtyCheckingVars_1': 'index1',
                                             '__dirtyCheckingVars_2': 'item1.name',
                                             '__dirtyCheckingVars_3': 'index2',
                                             '__dirtyCheckingVars_4': 'item2.name',
                                             "__dirtyCheckingVars_5": "index2",
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
         it('Getting data from content option with if', (done) => {
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
         it('Getting data from content option with if chained', (done) => {
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
         it('Getting data from content option with for', (done) => {
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
         it('Getting data from content option with for chained', (done) => {
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
         it('Content in Object chained', (done) => {
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
         it('Bind expressions', (done) => {
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
      });
   });
});
