import { createGlobalContext, IContext, IProgramMeta } from 'UI/_builder/Tmpl/core/Context';
import { ProgramNode } from 'UI/_builder/Tmpl/expressions/_private/Nodes';
import { Parser } from 'UI/_builder/Tmpl/expressions/_private/Parser';
import { assert } from 'chai';

// TODO: UI/_builder/Tmpl/* -> Compiler/*

function parse(source: string): ProgramNode {
   return new Parser().parse(source);
}

describe('Compiler/core/Context', () => {
   describe('Global context', () => {
      describe('Register bind program', () => {
         let global: IContext;
         let stringPrograms: string[];
         let programs: ProgramNode[];
         let returnedKeys: string[];

         before(() => {
            global = createGlobalContext();
            stringPrograms = [
               /* 0 */ 'a.b.c',
               /* 1 */ 'a.b.c.d',
               /* 2 */ 'e.f',
               /* 3 */ 'e.f.g',
               /* 4 */ 'h',
               /* 5 */ 'h.i',
               /* 6 */ 'j'
            ];
            programs = stringPrograms.map((stringProgram: string): ProgramNode => parse(stringProgram));
            returnedKeys = [
               global.registerBindProgram(programs[1]),
               global.registerBindProgram(programs[3]),
               global.registerBindProgram(programs[5]),
               global.registerBindProgram(programs[6])
            ];
         });

         it('Check returned keys', () => {
            const standardKeys = [
               '$p_1',
               '$p_3',
               '$p_5',
               '$p_6'
            ];
            assert.deepEqual(returnedKeys, standardKeys);
         });
         it('Check programs by key', () => {
            const standardKeys = [
               '$p_0',
               '$p_1',
               '$p_2',
               '$p_3',
               '$p_4',
               '$p_5',
               '$p_6'
            ];
            standardKeys.forEach((key: string, index: number): void => {
               assert.strictEqual(global.getProgram(key).string, stringPrograms[index]);
            });
         });
         it('Check identifiers', () => {
            const standardIdentifiers = [
               'a', 'e', 'h', 'j'
            ];
            assert.deepEqual(global.getIdentifiers(true), standardIdentifiers);
            assert.deepEqual(global.getIdentifiers(false), standardIdentifiers);
         });
         it('Check programs', () => {
            global.getPrograms(true).forEach((meta: IProgramMeta, index: number): void => {
               assert.strictEqual(meta.node.string, stringPrograms[index]);
            });
            global.getPrograms(false).forEach((meta: IProgramMeta, index: number): void => {
               assert.strictEqual(meta.node.string, stringPrograms[index]);
            });
         });
         it('Check internal programs', () => {
            global.getInternalPrograms().forEach((meta: IProgramMeta, index: number): void => {
               assert.strictEqual(meta.node.string, stringPrograms[index]);
            });
         });
      });
      describe('Register event program', () => {
         let global: IContext;
         let programs: ProgramNode[];

         before(() => {
            global = createGlobalContext();
            const stringPrograms = [
               'a()',
               'b.c(1, true, [])',
               'h(i, j ? k : m[n])'
            ];
            programs = stringPrograms.map((strProgram: string): ProgramNode => parse(strProgram));
            programs.forEach((program: ProgramNode): void => {
               global.registerEventProgram(program);
            });
         });

         it('Check identifiers', () => {
            const standardIdentifiers = [
               'a', 'b', 'h', 'i', 'j', 'm', 'n', 'k'
            ];
            assert.deepEqual(global.getIdentifiers(true), standardIdentifiers);
            assert.deepEqual(global.getIdentifiers(false), standardIdentifiers);
         });
         it('Check programs', () => {
            assert.isEmpty(global.getPrograms(true));
            assert.isEmpty(global.getPrograms(false));
         });
         it('Check internal programs', () => {
            assert.isEmpty(global.getInternalPrograms());
         });
      });
      describe('Register float program', () => {
         let global: IContext;
         let programs: ProgramNode[];

         before(() => {
            global = createGlobalContext();
            const stringPrograms = [
               'a(b)',
               'c.d(e)',
               'f.g.h(i)'
            ];
            programs = stringPrograms.map((strProgram: string): ProgramNode => parse(strProgram));
            programs.forEach((program: ProgramNode): void => {
               global.registerFloatProgram(program);
            });
         });

         it('Check identifiers', () => {
            const standardIdentifiers = [
               'a',
               'b',
               'c',
               'e',
               'f',
               'i'
            ];
            assert.deepEqual(global.getIdentifiers(true), standardIdentifiers);
            assert.deepEqual(global.getIdentifiers(false), standardIdentifiers);
         });
         it('Check programs', () => {
            assert.isEmpty(global.getPrograms(true));
            assert.isEmpty(global.getPrograms(false));
         });
         it('Check internal programs', () => {
            assert.isEmpty(global.getInternalPrograms());
         });
      });
      describe('Register program', () => {
         let global: IContext;
         let programs: ProgramNode[];
         let returnedKeys: string[];

         before(() => {
            global = createGlobalContext();
            const stringPrograms = [
               /* 0 */ 'a.b + c(d)',
               /* 1 */ 'e.f[g.h || i] === j',
               /* 2 */ 'k ? m + 1 : n / 2'
            ];
            programs = stringPrograms.map((stringProgram: string): ProgramNode => parse(stringProgram));
            returnedKeys = programs.map((program: ProgramNode): string => global.registerProgram(program));
         });

         it('Check returned keys', () => {
            const standardKeys = [
               '$p_0',
               '$p_1',
               '$p_2'
            ];
            assert.deepEqual(returnedKeys, standardKeys);
         });
         it('Check programs by key', () => {
            returnedKeys.forEach((key: string, index: number): void => {
               const program = programs[index];
               assert.strictEqual(global.getProgram(key), program);
            });
         });
         it('Check identifiers', () => {
            const standardIdentifiers = [
               'a', 'c', 'd', 'e', 'g', 'i', 'j', 'k', 'n', 'm'
            ];
            assert.deepEqual(global.getIdentifiers(true), standardIdentifiers);
            assert.deepEqual(global.getIdentifiers(false), standardIdentifiers);
         });
         it('Check programs', () => {
            global.getPrograms(true).forEach((meta: IProgramMeta, index: number): void => {
               const program = programs[index];
               assert.strictEqual(meta.node, program);
            });
            global.getPrograms(false).forEach((meta: IProgramMeta, index: number): void => {
               const program = programs[index];
               assert.strictEqual(meta.node, program);
            });
         });
         it('Check internal programs', () => {
            global.getInternalPrograms().forEach((meta: IProgramMeta, index: number): void => {
               const program = programs[index];
               assert.strictEqual(meta.node, program);
            });
         });
      });
   });
   describe('Nested context', () => {
      describe('Simple child context', () => {
         let global: IContext;
         let child: IContext;
         let programs: ProgramNode[];
         let returnedKeys: string[];

         before(() => {
            global = createGlobalContext();
            child = global.createContext();
            const stringPrograms = [
               /* 0 */ 'a.b + c(d)',
               /* 1 */ 'e.f[g.h || i] === j',
               /* 2 */ 'k ? m + 1 : n / 2'
            ];
            programs = stringPrograms.map((stringProgram: string): ProgramNode => parse(stringProgram));
            returnedKeys = programs.map((program: ProgramNode): string => child.registerProgram(program));
         });

         it('Check returned keys', () => {
            const standardKeys = [
               '$p_0',
               '$p_1',
               '$p_2'
            ];
            assert.deepEqual(returnedKeys, standardKeys);
         });
         it('Check child programs by key', () => {
            returnedKeys.forEach((key: string, index: number): void => {
               const program = programs[index];
               assert.strictEqual(child.getProgram(key), program);
            });
         });
         it('Check global identifiers', () => {
            const standardIdentifiers = [
               'a', 'c', 'd', 'e', 'g', 'i', 'j', 'k', 'n', 'm'
            ];
            assert.deepEqual(global.getIdentifiers(true), standardIdentifiers);
            assert.deepEqual(global.getIdentifiers(false), standardIdentifiers);
         });
         it('Check child identifiers', () => {
            const standardIdentifiers = [
               'a', 'c', 'd', 'e', 'g', 'i', 'j', 'k', 'n', 'm'
            ];
            assert.isEmpty(child.getIdentifiers(true));
            assert.deepEqual(child.getIdentifiers(false), standardIdentifiers);
         });
         it('Check global programs', () => {
            global.getPrograms(true).forEach((meta: IProgramMeta, index: number): void => {
               const program = programs[index];
               assert.strictEqual(meta.node, program);
            });
            global.getPrograms(false).forEach((meta: IProgramMeta, index: number): void => {
               const program = programs[index];
               assert.strictEqual(meta.node, program);
            });
         });
         it('Check child programs', () => {
            child.getPrograms(true).forEach((meta: IProgramMeta, index: number): void => {
               const program = programs[index];
               assert.strictEqual(meta.node, program);
            });
            child.getPrograms(false).forEach((meta: IProgramMeta, index: number): void => {
               const program = programs[index];
               assert.strictEqual(meta.node, program);
            });
         });
         it('Check global internal programs', () => {
            global.getInternalPrograms().forEach((meta: IProgramMeta, index: number): void => {
               const program = programs[index];
               assert.strictEqual(meta.node, program);
            });
         });
         it('Check child internal programs', () => {
            child.getInternalPrograms().forEach((meta: IProgramMeta, index: number): void => {
               const program = programs[index];
               assert.strictEqual(meta.node, program);
            });
         });
      });
      describe('Child context with identifiers', () => {
         let global: IContext;
         let child: IContext;
         let programs: ProgramNode[];
         let returnedKeys: string[];

         before(() => {
            global = createGlobalContext();
            child = global.createContext({
               identifiers: ['b']
            });
            const stringPrograms = [
               /* 0 */ 'a',
               /* 1 */ 'b.c',
               /* 2 */ 'b.d + e',
            ];
            // $p_0 -> 'a'
            // $p_1 -> 'b.c'
            // $p_2 -> 'b.d + e'
            // $p_3 -> 'e'
            programs = stringPrograms.map((stringProgram: string): ProgramNode => parse(stringProgram));
            returnedKeys = programs.map((program: ProgramNode): string => child.registerProgram(program));
         });

         it('Check returned keys', () => {
            const standardKeys = [
               '$p_0',
               '$p_1',
               '$p_2'
            ];
            assert.deepEqual(returnedKeys, standardKeys);
         });
         it('Check global identifiers', () => {
            assert.deepEqual(global.getIdentifiers(true), ['a', 'e']);
            assert.deepEqual(global.getIdentifiers(false), ['a', 'e']);
         });
         it('Check child identifiers', () => {
            assert.deepEqual(child.getIdentifiers(true), ['b']);
            assert.deepEqual(child.getIdentifiers(false), ['b', 'a', 'e']);
         });
         it('Check global internal programs', () => {
            const stringInternalPrograms = [
               'a',
               'e'
            ];
            const actualStringInternalPrograms = global.getInternalPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check child internal programs', () => {
            const stringInternalPrograms = [
               'a',
               'b.c',
               'b.d+e'
            ];
            const actualStringInternalPrograms = child.getInternalPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check global programs', () => {
            const globalStringPrograms = ['e'];
            global.getPrograms(true).forEach((meta: IProgramMeta, index: number): void => {
               const stringProgram = globalStringPrograms[index];
               assert.strictEqual(meta.node.string, stringProgram);
            });
            const localStringPrograms = ['e'];
            global.getPrograms(false).forEach((meta: IProgramMeta, index: number): void => {
               const stringProgram = localStringPrograms[index];
               assert.strictEqual(meta.node.string, stringProgram);
            });
         });
         it('Check child programs', () => {
            const globalStringPrograms = ['a', 'b.c', 'b.d+e'];
            child.getPrograms(true).forEach((meta: IProgramMeta, index: number): void => {
               const stringProgram = globalStringPrograms[index];
               assert.strictEqual(meta.node.string, stringProgram);
            });
            const localStringPrograms = ['e', 'a', 'b.c', 'b.d+e'];
            child.getPrograms(false).forEach((meta: IProgramMeta, index: number): void => {
               const stringProgram = localStringPrograms[index];
               assert.strictEqual(meta.node.string, stringProgram);
            });
         });
         it('Check global programs by key', () => {
            const childKeys = ['$p_3'];
            const stringPrograms = ['e'];
            childKeys.forEach((key: string, index: number): void => {
               const stringProgram = stringPrograms[index];
               assert.strictEqual(global.getProgram(key).string, stringProgram);
            });
         });
         it('Check child programs by key', () => {
            const childKeys = ['$p_0', '$p_1', '$p_2'];
            const stringPrograms = ['a', 'b.c', 'b.d+e'];
            childKeys.forEach((key: string, index: number): void => {
               const stringProgram = stringPrograms[index];
               assert.strictEqual(child.getProgram(key).string, stringProgram);
            });
         });
      });
   });
   describe('Isolated context', () => {
      describe('Simple child context', () => {
         let global: IContext;
         let child: IContext;

         before(() => {
            global = createGlobalContext();
            child = global.createContext();
            const stringPrograms = [
               'a(b)',
               'c.d(e)',
               'f.g.h(i)'
            ];
            const programs = stringPrograms.map((stringProgram: string): ProgramNode => parse(stringProgram));
            programs.forEach((program: ProgramNode): void => {
               child.registerFloatProgram(program);
            });
         });

         it('Check global identifiers', () => {
            const standardIdentifiers = [
               'a', 'b', 'c', 'e', 'f', 'i'
            ];
            assert.deepEqual(global.getIdentifiers(true), standardIdentifiers);
            assert.deepEqual(global.getIdentifiers(false), standardIdentifiers);
         });
         it('Check child identifiers', () => {
            const standardIdentifiers = [
               'a', 'b', 'c', 'e', 'f', 'i'
            ];
            assert.deepEqual(child.getIdentifiers(true), standardIdentifiers);
            assert.deepEqual(child.getIdentifiers(false), standardIdentifiers);
         });
         it('Check global internal programs', () => {
            const stringInternalPrograms = [
               'a', 'b', 'c', 'e', 'f', 'i'
            ];
            const actualStringInternalPrograms = global.getInternalPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check child internal programs', () => {
            assert.isEmpty(child.getInternalPrograms());
         });
         it('Check global programs', () => {
            const stringPrograms = [
               'a', 'b', 'c', 'e', 'f', 'i'
            ];
            const actualLocalStringPrograms = global.getPrograms(true)
               .map((meta: IProgramMeta): string => meta.node.string);
            const actualStringPrograms = global.getPrograms(false)
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualLocalStringPrograms, stringPrograms);
            assert.deepEqual(actualStringPrograms, stringPrograms);
         });
         it('Check child programs', () => {
            const stringPrograms = [
               'a', 'b', 'c', 'e', 'f', 'i'
            ];
            const actualStringLocalPrograms = child.getPrograms(true)
               .map((meta: IProgramMeta): string => meta.node.string);
            const actualStringPrograms = child.getPrograms(false)
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.isEmpty(actualStringLocalPrograms);
            assert.deepEqual(actualStringPrograms, stringPrograms);
         });
         it('Check global programs by key', () => {
            const standardKeys = [
               '$p_0', '$p_1', '$p_2', '$p_3', '$p_4', '$p_5'
            ];
            const stringPrograms = [
               'a', 'b', 'c', 'e', 'f', 'i'
            ];
            standardKeys.forEach((key: string, index: number): void => {
               const stringProgram = stringPrograms[index];
               assert.strictEqual(global.getProgram(key).string, stringProgram);
            });
         });
      });
      describe('Child context with identifiers', () => {
         let global: IContext;
         let child: IContext;

         before(() => {
            global = createGlobalContext();
            child = global.createContext({
               identifiers: ['c']
            });
            const stringPrograms = [
               'a(b)',
               'c.d(e)', // 'c' identifier should be ignored
               'f.g.h(i)'
            ];
            const programs = stringPrograms.map((stringProgram: string): ProgramNode => parse(stringProgram));
            programs.forEach((program: ProgramNode): void => {
               child.registerFloatProgram(program);
            });
         });

         it('Check global identifiers', () => {
            const standardIdentifiers = [
               'a', 'b', 'e', 'f', 'i'
            ];
            assert.deepEqual(global.getIdentifiers(true), standardIdentifiers);
            assert.deepEqual(global.getIdentifiers(false), standardIdentifiers);
         });
         it('Check child identifiers', () => {
            const standardIdentifiers = [
               'c', 'a', 'b', 'e', 'f', 'i'
            ];
            assert.deepEqual(child.getIdentifiers(true), standardIdentifiers);
            assert.deepEqual(child.getIdentifiers(false), standardIdentifiers);
         });
         it('Check global internal programs', () => {
            const stringInternalPrograms = [
               'a', 'b', 'e', 'f', 'i'
            ];
            const actualStringInternalPrograms = global.getInternalPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check child internal programs', () => {
            assert.isEmpty(child.getInternalPrograms());
         });
         it('Check global programs', () => {
            const stringPrograms = [
               'a', 'b', 'e', 'f', 'i'
            ];
            const actualLocalStringPrograms = global.getPrograms(true)
               .map((meta: IProgramMeta): string => meta.node.string);
            const actualStringPrograms = global.getPrograms(false)
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualLocalStringPrograms, stringPrograms);
            assert.deepEqual(actualStringPrograms, stringPrograms);
         });
         it('Check child programs', () => {
            const stringPrograms = [
               'a', 'b', 'e', 'f', 'i'
            ];
            const actualStringLocalPrograms = child.getPrograms(true)
               .map((meta: IProgramMeta): string => meta.node.string);
            const actualStringPrograms = child.getPrograms(false)
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.isEmpty(actualStringLocalPrograms);
            assert.deepEqual(actualStringPrograms, stringPrograms);
         });
         it('Check global programs by key', () => {
            const standardKeys = [
               '$p_0', '$p_1', '$p_2', '$p_3', '$p_4'
            ];
            const stringPrograms = [
               'a', 'b', 'e', 'f', 'i'
            ];
            standardKeys.forEach((key: string, index: number): void => {
               const stringProgram = stringPrograms[index];
               assert.strictEqual(global.getProgram(key).string, stringProgram);
            });
         });
      });
   });
   describe('Join isolated context', () => {
      let global: IContext;
      let firstChild: IContext;
      let secondChild: IContext;
      let returnedKeys: string[];

      // <@global>
      //   {{ a.property }}
      //
      //   <#firstChild>
      //     {{ b.property + c.property }}
      //     {{ d.property }}
      //   </#firstChild>
      //   <@secondChild join-on="c,d">
      //     {{ e.property }}
      //   </@secondChild>
      // </@global>

      before(() => {
         global = createGlobalContext();
         firstChild = global.createContext({
            allowHoisting: false
         });
         secondChild = global.createContext();
         returnedKeys = [
            global.registerProgram(parse('a.property')),
            firstChild.registerProgram(parse('b.property + c.property')),
            firstChild.registerProgram(parse('d.property')),
            secondChild.registerProgram(parse('e.property'))
         ];
         secondChild.joinContext(firstChild, { identifiers: ['c', 'd'] });
      });

      it('Check returned keys', () => {
         const standardKeys = [
            '$p_0',
            '$p_1',
            '$p_2',
            '$p_3'
         ];
         assert.deepEqual(returnedKeys, standardKeys);
      });
      it('Check global identifiers', () => {
         assert.deepEqual(global.getIdentifiers(true), ['a', 'e', 'b']);
         assert.deepEqual(global.getIdentifiers(false), ['a', 'e', 'b']);
      });
      it('Check first child identifiers', () => {
         assert.deepEqual(firstChild.getIdentifiers(true), ['b', 'c', 'd']);
         assert.deepEqual(firstChild.getIdentifiers(false), ['b', 'c', 'd', 'a', 'e']);
      });
      it('Check second child identifiers', () => {
         assert.isEmpty(secondChild.getIdentifiers(true));
         assert.deepEqual(secondChild.getIdentifiers(false), ['a', 'e', 'b']);
      });
      it('Check global internal programs', () => {
         const stringInternalPrograms = ['a.property', 'e.property', 'b'];
         const actualStringInternalPrograms = global.getInternalPrograms()
            .map((meta: IProgramMeta): string => meta.node.string);
         assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
      });
      it('Check first child internal programs', () => {
         const stringInternalPrograms = ['b.property+c.property', 'd.property'];
         const actualStringInternalPrograms = firstChild.getInternalPrograms()
            .map((meta: IProgramMeta): string => meta.node.string);
         assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
      });
      it('Check second child internal programs', () => {
         const stringInternalPrograms = ['e.property'];
         const actualStringInternalPrograms = secondChild.getInternalPrograms()
            .map((meta: IProgramMeta): string => meta.node.string);
         assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
      });
      it('Check global programs', () => {
         const actualLocalStringPrograms = global.getPrograms(true)
            .map((meta: IProgramMeta): string => meta.node.string);
         const actualStringPrograms = global.getPrograms(false)
            .map((meta: IProgramMeta): string => meta.node.string);
         assert.deepEqual(actualLocalStringPrograms, ['a.property', 'b']);
         assert.deepEqual(actualStringPrograms, ['a.property', 'b']);
      });
      it('Check first child programs', () => {
         const actualLocalStringPrograms = firstChild.getPrograms(true)
            .map((meta: IProgramMeta): string => meta.node.string);
         const actualStringPrograms = firstChild.getPrograms(false)
            .map((meta: IProgramMeta): string => meta.node.string);
         assert.deepEqual(actualLocalStringPrograms, ['b.property+c.property', 'd.property']);
         assert.deepEqual(actualStringPrograms, ['a.property', 'b', 'b.property+c.property', 'd.property']);
      });
      it('Check second child programs', () => {
         const actualLocalStringPrograms = secondChild.getPrograms(true)
            .map((meta: IProgramMeta): string => meta.node.string);
         const actualStringPrograms = secondChild.getPrograms(false)
            .map((meta: IProgramMeta): string => meta.node.string);
         assert.deepEqual(actualLocalStringPrograms, ['e.property']);
         assert.deepEqual(actualStringPrograms, ['a.property', 'b', 'e.property']);
      });
   });
   describe('Intersections in context', () => {
      describe('Nested', () => {
         let global: IContext;
         let firstChild: IContext;
         let secondChild: IContext;
         let returnedKeys: string[];

         before(() => {
            global = createGlobalContext();
            firstChild = global.createContext({
               identifiers: ['a']
            });
            secondChild = firstChild.createContext({
               identifiers: ['a']
            });
            returnedKeys = [
               global.registerProgram(parse('a.b')),
               firstChild.registerProgram(parse('a.b')),
               secondChild.registerProgram(parse('a.b'))
            ];
         });

         it('Check returned keys', () => {
            const standardKeys = [
               '$p_0',
               '$p_1',
               '$p_2'
            ];
            assert.deepEqual(returnedKeys, standardKeys);
         });
         it('Check global identifiers', () => {
            assert.deepEqual(global.getIdentifiers(true), ['a']);
            assert.deepEqual(global.getIdentifiers(false), ['a']);
         });
         it('Check first child identifiers', () => {
            assert.deepEqual(firstChild.getIdentifiers(true), ['a']);
            assert.deepEqual(firstChild.getIdentifiers(false), ['a']);
         });
         it('Check second child identifiers', () => {
            assert.deepEqual(secondChild.getIdentifiers(true), ['a']);
            assert.deepEqual(secondChild.getIdentifiers(false), ['a']);
         });
         it('Check global internal programs', () => {
            const stringInternalPrograms = ['a.b'];
            const actualStringInternalPrograms = global.getInternalPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check first child internal programs', () => {
            const stringInternalPrograms = ['a.b'];
            const actualStringInternalPrograms = firstChild.getInternalPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check second child internal programs', () => {
            const stringInternalPrograms = ['a.b'];
            const actualStringInternalPrograms = secondChild.getInternalPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check global programs', () => {
            const actualLocalStringPrograms = global.getPrograms(true)
               .map((meta: IProgramMeta): string => meta.node.string);
            const actualStringPrograms = global.getPrograms(false)
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
            assert.deepEqual(actualStringPrograms, ['a.b']);
         });
         it('Check first child programs', () => {
            const actualLocalStringPrograms = firstChild.getPrograms(true)
               .map((meta: IProgramMeta): string => meta.node.string);
            const actualStringPrograms = firstChild.getPrograms(false)
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
            assert.deepEqual(actualStringPrograms, ['a.b', 'a.b']);
         });
         it('Check second child programs', () => {
            const actualLocalStringPrograms = secondChild.getPrograms(true)
               .map((meta: IProgramMeta): string => meta.node.string);
            const actualStringPrograms = secondChild.getPrograms(false)
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
            assert.deepEqual(actualStringPrograms, ['a.b', 'a.b', 'a.b']);
         });
         it('Check global programs by key', () => {
            const unreachableKeys = ['$p_1', '$p_2'];
            assert.strictEqual(global.getProgram('$p_0').string, 'a.b');
            unreachableKeys.forEach((key: string): void => {
               try {
                  global.getProgram(key);
               } catch (error) {
                  assert.strictEqual(error.message, `Выражение с ключом "${key}" не было зарегистрировано в текущем контексте`);
                  return;
               }
               throw new Error(`Выражение с ключом "${key}" не должно существовать в данном контексте`);
            });
         });
         it('Check first child programs by key', () => {
            const unreachableKeys = ['$p_0', '$p_2'];
            assert.strictEqual(firstChild.getProgram('$p_1').string, 'a.b');
            unreachableKeys.forEach((key: string): void => {
               try {
                  firstChild.getProgram(key);
               } catch (error) {
                  assert.strictEqual(error.message, `Выражение с ключом "${key}" не было зарегистрировано в текущем контексте`);
                  return;
               }
               throw new Error(`Выражение с ключом "${key}" не должно существовать в данном контексте`);
            });
         });
         it('Check second child programs by key', () => {
            const unreachableKeys = ['$p_0', '$p_1'];
            assert.strictEqual(secondChild.getProgram('$p_2').string, 'a.b');
            unreachableKeys.forEach((key: string): void => {
               try {
                  secondChild.getProgram(key);
               } catch (error) {
                  assert.strictEqual(error.message, `Выражение с ключом "${key}" не было зарегистрировано в текущем контексте`);
                  return;
               }
               throw new Error(`Выражение с ключом "${key}" не должно существовать в данном контексте`);
            });
         });
      });
      describe('Sibling', () => {
         let global: IContext;
         let firstChild: IContext;
         let secondChild: IContext;
         let returnedKeys: string[];

         before(() => {
            global = createGlobalContext();
            firstChild = global.createContext({
               identifiers: ['a']
            });
            secondChild = global.createContext({
               identifiers: ['a']
            });
            returnedKeys = [
               global.registerProgram(parse('a.b')),
               firstChild.registerProgram(parse('a.b')),
               secondChild.registerProgram(parse('a.b'))
            ];
         });

         it('Check returned keys', () => {
            const standardKeys = [
               '$p_0',
               '$p_1',
               '$p_2'
            ];
            assert.deepEqual(returnedKeys, standardKeys);
         });
         it('Check global identifiers', () => {
            assert.deepEqual(global.getIdentifiers(true), ['a']);
            assert.deepEqual(global.getIdentifiers(false), ['a']);
         });
         it('Check first child identifiers', () => {
            assert.deepEqual(firstChild.getIdentifiers(true), ['a']);
            assert.deepEqual(firstChild.getIdentifiers(false), ['a']);
         });
         it('Check second child identifiers', () => {
            assert.deepEqual(secondChild.getIdentifiers(true), ['a']);
            assert.deepEqual(secondChild.getIdentifiers(false), ['a']);
         });
         it('Check global internal programs', () => {
            const stringInternalPrograms = ['a.b'];
            const actualStringInternalPrograms = global.getInternalPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check first child internal programs', () => {
            const stringInternalPrograms = ['a.b'];
            const actualStringInternalPrograms = firstChild.getInternalPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check second child internal programs', () => {
            const stringInternalPrograms = ['a.b'];
            const actualStringInternalPrograms = secondChild.getInternalPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check global programs', () => {
            const actualLocalStringPrograms = global.getPrograms(true)
               .map((meta: IProgramMeta): string => meta.node.string);
            const actualStringPrograms = global.getPrograms(false)
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
            assert.deepEqual(actualStringPrograms, ['a.b']);
         });
         it('Check first child programs', () => {
            const actualLocalStringPrograms = firstChild.getPrograms(true)
               .map((meta: IProgramMeta): string => meta.node.string);
            const actualStringPrograms = firstChild.getPrograms(false)
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
            assert.deepEqual(actualStringPrograms, ['a.b', 'a.b']);
         });
         it('Check second child programs', () => {
            const actualLocalStringPrograms = secondChild.getPrograms(true)
               .map((meta: IProgramMeta): string => meta.node.string);
            const actualStringPrograms = secondChild.getPrograms(false)
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
            assert.deepEqual(actualStringPrograms, ['a.b', 'a.b']);
         });
         it('Check global programs by key', () => {
            const unreachableKeys = ['$p_1', '$p_2'];
            assert.strictEqual(global.getProgram('$p_0').string, 'a.b');
            unreachableKeys.forEach((key: string): void => {
               try {
                  global.getProgram(key);
               } catch (error) {
                  assert.strictEqual(error.message, `Выражение с ключом "${key}" не было зарегистрировано в текущем контексте`);
                  return;
               }
               throw new Error(`Выражение с ключом "${key}" не должно существовать в данном контексте`);
            });
         });
         it('Check first child programs by key', () => {
            const unreachableKeys = ['$p_0', '$p_2'];
            assert.strictEqual(firstChild.getProgram('$p_1').string, 'a.b');
            unreachableKeys.forEach((key: string): void => {
               try {
                  firstChild.getProgram(key);
               } catch (error) {
                  assert.strictEqual(error.message, `Выражение с ключом "${key}" не было зарегистрировано в текущем контексте`);
                  return;
               }
               throw new Error(`Выражение с ключом "${key}" не должно существовать в данном контексте`);
            });
         });
         it('Check second child programs by key', () => {
            const unreachableKeys = ['$p_0', '$p_1'];
            assert.strictEqual(secondChild.getProgram('$p_2').string, 'a.b');
            unreachableKeys.forEach((key: string): void => {
               try {
                  secondChild.getProgram(key);
               } catch (error) {
                  assert.strictEqual(error.message, `Выражение с ключом "${key}" не было зарегистрировано в текущем контексте`);
                  return;
               }
               throw new Error(`Выражение с ключом "${key}" не должно существовать в данном контексте`);
            });
         });
      });
      describe('Isolated', () => {
         let global: IContext;
         let firstChild: IContext;
         let secondChild: IContext;
         let returnedKeys: string[];

         before(() => {
            global = createGlobalContext();
            firstChild = global.createContext({
               allowHoisting: false
            });
            secondChild = global.createContext({
               allowHoisting: false
            });
            returnedKeys = [
               global.registerProgram(parse('a.b')),
               firstChild.registerProgram(parse('c.d')),
               secondChild.registerProgram(parse('e.f'))
            ];
         });

         it('Check returned keys', () => {
            const standardKeys = [
               '$p_0',
               '$p_1',
               '$p_2'
            ];
            assert.deepEqual(returnedKeys, standardKeys);
         });
         it('Check global identifiers', () => {
            assert.deepEqual(global.getIdentifiers(true), ['a']);
            assert.deepEqual(global.getIdentifiers(false), ['a']);
         });
         it('Check first child identifiers', () => {
            assert.deepEqual(firstChild.getIdentifiers(true), ['c']);
            assert.deepEqual(firstChild.getIdentifiers(false), ['c', 'a']);
         });
         it('Check second child identifiers', () => {
            assert.deepEqual(secondChild.getIdentifiers(true), ['e']);
            assert.deepEqual(secondChild.getIdentifiers(false), ['e', 'a']);
         });
         it('Check global internal programs', () => {
            const stringInternalPrograms = ['a.b'];
            const actualStringInternalPrograms = global.getInternalPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check first child internal programs', () => {
            const stringInternalPrograms = ['c.d'];
            const actualStringInternalPrograms = firstChild.getInternalPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check second child internal programs', () => {
            const stringInternalPrograms = ['e.f'];
            const actualStringInternalPrograms = secondChild.getInternalPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check global programs', () => {
            const actualLocalStringPrograms = global.getPrograms(true)
               .map((meta: IProgramMeta): string => meta.node.string);
            const actualStringPrograms = global.getPrograms(false)
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
            assert.deepEqual(actualStringPrograms, ['a.b']);
         });
         it('Check first child programs', () => {
            const actualLocalStringPrograms = firstChild.getPrograms(true)
               .map((meta: IProgramMeta): string => meta.node.string);
            const actualStringPrograms = firstChild.getPrograms(false)
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualLocalStringPrograms, ['c.d']);
            assert.deepEqual(actualStringPrograms, ['a.b', 'c.d']);
         });
         it('Check second child programs', () => {
            const actualLocalStringPrograms = secondChild.getPrograms(true)
               .map((meta: IProgramMeta): string => meta.node.string);
            const actualStringPrograms = secondChild.getPrograms(false)
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualLocalStringPrograms, ['e.f']);
            assert.deepEqual(actualStringPrograms, ['a.b', 'e.f']);
         });
         it('Check global programs by key', () => {
            const unreachableKeys = ['$p_1', '$p_2'];
            assert.strictEqual(global.getProgram('$p_0').string, 'a.b');
            unreachableKeys.forEach((key: string): void => {
               try {
                  global.getProgram(key);
               } catch (error) {
                  assert.strictEqual(error.message, `Выражение с ключом "${key}" не было зарегистрировано в текущем контексте`);
                  return;
               }
               throw new Error(`Выражение с ключом "${key}" не должно существовать в данном контексте`);
            });
         });
         it('Check first child programs by key', () => {
            const unreachableKeys = ['$p_0', '$p_2'];
            assert.strictEqual(firstChild.getProgram('$p_1').string, 'c.d');
            unreachableKeys.forEach((key: string): void => {
               try {
                  firstChild.getProgram(key);
               } catch (error) {
                  assert.strictEqual(error.message, `Выражение с ключом "${key}" не было зарегистрировано в текущем контексте`);
                  return;
               }
               throw new Error(`Выражение с ключом "${key}" не должно существовать в данном контексте`);
            });
         });
         it('Check second child programs by key', () => {
            const unreachableKeys = ['$p_0', '$p_1'];
            assert.strictEqual(secondChild.getProgram('$p_2').string, 'e.f');
            unreachableKeys.forEach((key: string): void => {
               try {
                  secondChild.getProgram(key);
               } catch (error) {
                  assert.strictEqual(error.message, `Выражение с ключом "${key}" не было зарегистрировано в текущем контексте`);
                  return;
               }
               throw new Error(`Выражение с ключом "${key}" не должно существовать в данном контексте`);
            });
         });
      });
   });
});
