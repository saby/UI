/* global describe, it, assert */
define(['Compiler/core/function'], function(functionModule) {
   describe('Compiler/core/function', function() {
      beforeEach(function() {
         functionModule.functionNames = {};
      });
      afterEach(function() {
         functionModule.functionNames = null;
      });
      describe('getFuncNameByFile', function() {
         it('undefined', function() {
            var funcName = functionModule.getFuncNameByFile(undefined);
            assert.isTrue(funcName === undefined);
         });
         it('empty string', function() {
            var funcName = functionModule.getFuncNameByFile('');
            assert.isTrue(funcName === '');
         });
         it('wml!', function() {
            var funcName = functionModule.getFuncNameByFile('wml!A.B/_c-d/e:f');
            assert.isTrue(funcName === 'A_B__c_d_e_f');
         });
         it('*.wml', function() {
            var funcName = functionModule.getFuncNameByFile('A.B/_c-d/e:f.wml');
            assert.isTrue(funcName === 'A_B__c_d_e_f');
         });
         it('tmpl!', function() {
            var funcName = functionModule.getFuncNameByFile('tmpl!A.B/_c-d/e:f');
            assert.isTrue(funcName === 'A_B__c_d_e_f');
         });
         it('*.tmpl', function() {
            var funcName = functionModule.getFuncNameByFile('A.B/_c-d/e:f.tmpl');
            assert.isTrue(funcName === 'A_B__c_d_e_f');
         });
         it('only component', function() {
            var funcName = functionModule.getFuncNameByFile('A.B/_c-d/e:f');
            assert.isTrue(funcName === 'A_B__c_d_e_f');
         });
         it('no replace needed', function() {
            var funcName = functionModule.getFuncNameByFile('A_B__c_d_e_f');
            assert.isTrue(funcName === 'A_B__c_d_e_f');
         });
         it('leading digits', function() {
            var funcName = functionModule.getFuncNameByFile('12A.34B/_5c6-d7/e8:f9');
            assert.isTrue(funcName === 'A_34B__5c6_d7_e8_f9');
         });
         it('invalid characters', function() {
            var funcName = functionModule.getFuncNameByFile('A.B/_c,-d!/e#:f, (gh) ij!');
            assert.isTrue(funcName === 'A_B__c_d_e_f_gh_ij');
         });
      });
      describe('getFuncNameByTemplate', function() {
         it('undefined', function() {
            var funcName = functionModule.getFuncNameByTemplate(undefined);
            assert.isTrue(funcName === undefined);
         });
         it('empty string', function() {
            var funcName = functionModule.getFuncNameByTemplate('');
            assert.isTrue(funcName === '');
         });
         it('good wsTemplateName with wml!', function() {
            var funcName = functionModule.getFuncNameByTemplate({ data: { type: 'text', value: 'wml!A.B/_c-d/e:f' } });
            assert.isTrue(funcName === 'A_B__c_d_e_f');
         });
         it('good wsTemplateName with *.wml', function() {
            var funcName = functionModule.getFuncNameByTemplate({ data: { type: 'text', value: 'A.B/_c-d/e:f.wml' } });
            assert.isTrue(funcName === 'A_B__c_d_e_f');
         });
         it('good wsTemplateName with tmpl!', function() {
            var funcName = functionModule.getFuncNameByTemplate({ data: { type: 'text', value: 'tmpl!A.B/_c-d/e:f' } });
            assert.isTrue(funcName === 'A_B__c_d_e_f');
         });
         it('good wsTemplateName with *.tmpl', function() {
            var funcName = functionModule.getFuncNameByTemplate({ data: { type: 'text', value: 'A.B/_c-d/e:f.tmpl' } });
            assert.isTrue(funcName === 'A_B__c_d_e_f');
         });
         it('bad wsTemplateName', function() {
            var funcName = functionModule.getFuncNameByTemplate({ data: { type: 'not-text', value: 'something-else' } });
            assert.isTrue(funcName === undefined);
         });
      });
      describe('getFuncName', function() {
         it('undefined to Unknown', function() {
            var funcName = functionModule.getFuncName(undefined, undefined, undefined);
            assert.isTrue(funcName === 'Unknown');
            assert.isTrue(functionModule.functionNames['Unknown'] === 2);
            var funcName2 = functionModule.getFuncName(undefined, undefined, undefined);
            assert.isTrue(funcName2 === 'Unknown_2');
            assert.isTrue(functionModule.functionNames['Unknown'] === 3);
            var funcName3 = functionModule.getFuncName(undefined, undefined, undefined);
            assert.isTrue(funcName3 === 'Unknown_3');
            assert.isTrue(functionModule.functionNames['Unknown'] === 4);
         });
         it('only property name', function() {
            var funcName = functionModule.getFuncName('testProperty', undefined, undefined);
            assert.isTrue(funcName === 'testProperty');
            assert.isTrue(functionModule.functionNames['testProperty'] === 2);
            var funcName2 = functionModule.getFuncName('testProperty', undefined, undefined);
            assert.isTrue(funcName2 === 'testProperty_2');
            assert.isTrue(functionModule.functionNames['testProperty'] === 3);
            var funcName3 = functionModule.getFuncName('testProperty', undefined, undefined);
            assert.isTrue(funcName3 === 'testProperty_3');
            assert.isTrue(functionModule.functionNames['testProperty'] === 4);
         });
         it('only file name', function() {
            var funcName = functionModule.getFuncName(undefined, 'wml!A.B/_c-d/e:f', undefined);
            assert.isTrue(funcName === 'A_B__c_d_e_f');
            assert.isTrue(functionModule.functionNames['A_B__c_d_e_f'] === 2);
            var funcName2 = functionModule.getFuncName(undefined, 'wml!A.B/_c-d/e:f', undefined);
            assert.isTrue(funcName2 === 'A_B__c_d_e_f_2');
            assert.isTrue(functionModule.functionNames['A_B__c_d_e_f'] === 3);
            var funcName3 = functionModule.getFuncName(undefined, 'wml!A.B/_c-d/e:f', undefined);
            assert.isTrue(funcName3 === 'A_B__c_d_e_f_3');
            assert.isTrue(functionModule.functionNames['A_B__c_d_e_f'] === 4);
         });
         it('only wasaby template name', function() {
            var funcName = functionModule.getFuncName(undefined, undefined, 'wml!A.B/_c-d/e:f');
            assert.isTrue(funcName === 'A_B__c_d_e_f');
            assert.isTrue(functionModule.functionNames['A_B__c_d_e_f'] === 2);
            var funcName2 = functionModule.getFuncName(undefined, undefined, { data: { type: 'text', value: 'wml!A.B/_c-d/e:f' } });
            assert.isTrue(funcName2 === 'A_B__c_d_e_f_2');
            assert.isTrue(functionModule.functionNames['A_B__c_d_e_f'] === 3);
            var funcName3 = functionModule.getFuncName(undefined, undefined, { data: { type: 'text', value: 'A.B/_c-d/e:f.tmpl' } });
            assert.isTrue(funcName3 === 'A_B__c_d_e_f_3');
            assert.isTrue(functionModule.functionNames['A_B__c_d_e_f'] === 4);
         });
         it('mixed arguments', function() {
            var funcName = functionModule.getFuncName(undefined, undefined, 'wml!A.B/_c-d/e:f');
            assert.isTrue(funcName === 'A_B__c_d_e_f');
            assert.isTrue(functionModule.functionNames['A_B__c_d_e_f'] === 2);
            var funcName2 = functionModule.getFuncName(undefined, undefined, { data: { type: 'text', value: 'wml!A.B/_c-d/e:f' } });
            assert.isTrue(funcName2 === 'A_B__c_d_e_f_2');
            assert.isTrue(functionModule.functionNames['A_B__c_d_e_f'] === 3);
            var funcName3 = functionModule.getFuncName('testProperty', undefined, undefined);
            assert.isTrue(funcName3 === 'testProperty');
            assert.isTrue(functionModule.functionNames['testProperty'] === 2);
            assert.isTrue(functionModule.functionNames['A_B__c_d_e_f'] === 3);
         });
         it('mixed arguments 2', function() {
            var funcName = functionModule.getFuncName('testProperty', undefined, 'wml!A.B/_c-d/e:f');
            assert.isTrue(funcName === 'A_B__c_d_e_f');
            assert.isTrue(functionModule.functionNames['A_B__c_d_e_f'] === 2);
            var funcName2 = functionModule.getFuncName(undefined, 'G.H/_i-j/k:l.tmpl', { data: { type: 'text', value: 'wml!A.B/_c-d/e:f' } });
            assert.isTrue(funcName2 === 'A_B__c_d_e_f_2');
            assert.isTrue(functionModule.functionNames['A_B__c_d_e_f'] === 3);
            var funcName3 = functionModule.getFuncName('testProperty', undefined, { data: { type: 'text', value: 'wml!G.H/_i-j/k:l' } });
            assert.isTrue(funcName3 === 'G_H__i_j_k_l');
            assert.isTrue(functionModule.functionNames['G_H__i_j_k_l'] === 2);
            assert.isTrue(functionModule.functionNames['A_B__c_d_e_f'] === 3);
         });
         it('mixed arguments 3', function() {
            var funcName = functionModule.getFuncName('testProperty', 'wml!A.B', undefined);
            assert.isTrue(funcName === 'A_B');
            assert.isTrue(functionModule.functionNames['A_B'] === 2);
            var funcName2 = functionModule.getFuncName(undefined, 'tmpl!C.D', { data: { type: 'text', value: 'wml!E.F' } });
            assert.isTrue(funcName2 === 'E_F');
            assert.isTrue(functionModule.functionNames['E_F'] === 2);
            var funcName3 = functionModule.getFuncName('testProperty', undefined, { data: { type: 'text', value: 'wml!E.F' } });
            assert.isTrue(funcName3 === 'E_F_2');
            assert.isTrue(functionModule.functionNames['A_B'] === 2);
            assert.isTrue(functionModule.functionNames['E_F'] === 3);
         });
      });
      describe('setFunctionName', function() {
         it('names for anonymous function', function() {
            var func = new Function('', '');
            var funcName = functionModule.setFunctionName(func, { data: { type: 'text', value: 'wml!A.B' } }, 'wml!G.H', 'test');
            assert.isTrue(funcName === 'A_B' && func.name === 'A_B');
            assert.isTrue(functionModule.functionNames['A_B'] === 2);
            var func2 = new Function('', '');
            var funcName2 = functionModule.setFunctionName(func2, { data: { type: 'text', value: 'wml!A.B' } }, 'wml!G.H', 'test');
            assert.isTrue(funcName2 === 'A_B_2' && func2.name === 'A_B_2');
            assert.isTrue(functionModule.functionNames['A_B'] === 3);
         });
         it('names for not anonymous function', function() {
            var func = new Function('', '');
            Object.defineProperty(func, 'name', { 'value': 'testFunction', configurable: true });
            var funcName = functionModule.setFunctionName(func, { data: { type: 'text', value: 'wml!A.B' } }, 'wml!G.H', 'test');
            assert.isTrue(funcName === 'testFunction' && func.name === 'testFunction');
            assert.isFalse('testFunction' in functionModule.functionNames);
         });
         it('names for string', function() {
            var funcName = functionModule.setFunctionName(undefined, undefined, 'wml!A.B', 'testProperty');
            assert.isTrue(funcName === 'A_B');
            assert.isTrue(functionModule.functionNames['A_B'] === 2);
            var funcName2 = functionModule.setFunctionName(undefined, { data: { type: 'text', value: 'wml!E.F' } }, 'tmpl!C.D', undefined);
            assert.isTrue(funcName2 === 'E_F');
            assert.isTrue(functionModule.functionNames['E_F'] === 2);
            var funcName3 = functionModule.setFunctionName(undefined, { data: { type: 'text', value: 'wml!E.F' } }, undefined, 'testProperty');
            assert.isTrue(funcName3 === 'E_F_2');
            assert.isTrue(functionModule.functionNames['A_B'] === 2);
            assert.isTrue(functionModule.functionNames['E_F'] === 3);
         });
      });
   });
});
