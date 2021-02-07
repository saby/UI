import { createGlobalContext, IContext, IProgramMeta, ContextType, SpecialProgramType } from 'Compiler/core/Context';
import { ProgramNode } from 'Compiler/expressions/Nodes';
import { Parser } from 'Compiler/expressions/Parser';
import { assert } from 'chai';

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
               global.registerProgram(programs[1], SpecialProgramType.BIND),
               global.registerProgram(programs[3], SpecialProgramType.BIND),
               global.registerProgram(programs[5], SpecialProgramType.BIND),
               global.registerProgram(programs[6], SpecialProgramType.BIND)
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
         it('Check identifiers', () => {
            const standardIdentifiers = [
               'a', 'e', 'h', 'j'
            ];
            assert.deepEqual(global.getOwnIdentifiers(), standardIdentifiers);
         });
         it('Check programs', () => {
            global.getOwnPrograms().forEach((meta: IProgramMeta, index: number): void => {
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
               global.registerProgram(program, SpecialProgramType.EVENT);
            });
         });

         it('Check identifiers', () => {
            const standardIdentifiers = [
               'a', 'b', 'h', 'i', 'j', 'm', 'n', 'k'
            ];
            assert.deepEqual(global.getOwnIdentifiers(), standardIdentifiers);
         });
         it('Check programs', () => {
            assert.isEmpty(global.getOwnPrograms());
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
               global.registerProgram(program, SpecialProgramType.FLOAT);
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
            assert.deepEqual(global.getOwnIdentifiers(), standardIdentifiers);
         });
         it('Check programs', () => {
            assert.isEmpty(global.getOwnPrograms());
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
         it('Check identifiers', () => {
            const standardIdentifiers = [
               'a', 'c', 'd', 'e', 'g', 'i', 'j', 'k', 'n', 'm'
            ];
            assert.deepEqual(global.getOwnIdentifiers(), standardIdentifiers);
         });
         it('Check programs', () => {
            global.getOwnPrograms().forEach((meta: IProgramMeta, index: number): void => {
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
         it('Check global identifiers', () => {
            const standardIdentifiers = [
               'a', 'c', 'd', 'e', 'g', 'i', 'j', 'k', 'n', 'm'
            ];
            assert.deepEqual(global.getOwnIdentifiers(), standardIdentifiers);
         });
         it('Check child identifiers', () => {
            assert.isEmpty(child.getOwnIdentifiers());
         });
         it('Check global programs', () => {
            global.getOwnPrograms().forEach((meta: IProgramMeta, index: number): void => {
               const program = programs[index];
               assert.strictEqual(meta.node, program);
            });
         });
         it('Check child programs', () => {
            child.getOwnPrograms().forEach((meta: IProgramMeta, index: number): void => {
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
            assert.deepEqual(global.getOwnIdentifiers(), ['a', 'e']);
         });
         it('Check child identifiers', () => {
            assert.deepEqual(child.getOwnIdentifiers(), ['b']);
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
            global.getOwnPrograms().forEach((meta: IProgramMeta, index: number): void => {
               const stringProgram = globalStringPrograms[index];
               assert.strictEqual(meta.node.string, stringProgram);
            });
         });
         it('Check child programs', () => {
            const globalStringPrograms = ['a', 'b.c', 'b.d+e'];
            child.getOwnPrograms().forEach((meta: IProgramMeta, index: number): void => {
               const stringProgram = globalStringPrograms[index];
               assert.strictEqual(meta.node.string, stringProgram);
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
               child.registerProgram(program, SpecialProgramType.FLOAT);
            });
         });

         it('Check global identifiers', () => {
            const standardIdentifiers = [
               'a', 'b', 'c', 'e', 'f', 'i'
            ];
            assert.deepEqual(global.getOwnIdentifiers(), standardIdentifiers);
         });
         it('Check child identifiers', () => {
            const standardIdentifiers = [
               'a', 'b', 'c', 'e', 'f', 'i'
            ];
            assert.deepEqual(child.getOwnIdentifiers(), standardIdentifiers);
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
            const actualLocalStringPrograms = global.getOwnPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualLocalStringPrograms, stringPrograms);
         });
         it('Check child programs', () => {
            const actualStringLocalPrograms = child.getOwnPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.isEmpty(actualStringLocalPrograms);
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
               child.registerProgram(program, SpecialProgramType.FLOAT);
            });
         });

         it('Check global identifiers', () => {
            const standardIdentifiers = [
               'a', 'b', 'e', 'f', 'i'
            ];
            assert.deepEqual(global.getOwnIdentifiers(), standardIdentifiers);
         });
         it('Check child identifiers', () => {
            const standardIdentifiers = [
               'c', 'a', 'b', 'e', 'f', 'i'
            ];
            assert.deepEqual(child.getOwnIdentifiers(), standardIdentifiers);
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
            const actualLocalStringPrograms = global.getOwnPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualLocalStringPrograms, stringPrograms);
         });
         it('Check child programs', () => {
            const actualStringLocalPrograms = child.getOwnPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.isEmpty(actualStringLocalPrograms);
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
            type: ContextType.ISOLATED
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
         assert.deepEqual(global.getOwnIdentifiers(), [ 'a', 'b', 'c', 'd', 'e' ]);
      });
      it('Check first child identifiers', () => {
         assert.deepEqual(firstChild.getOwnIdentifiers(), ['b', 'c', 'd']);
      });
      it('Check second child identifiers', () => {
         assert.isEmpty(secondChild.getOwnIdentifiers());
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
         const actualLocalStringPrograms = global.getOwnPrograms()
            .map((meta: IProgramMeta): string => meta.node.string);
         assert.deepEqual(actualLocalStringPrograms, ['a.property', 'b']);
      });
      it('Check first child programs', () => {
         const actualLocalStringPrograms = firstChild.getOwnPrograms()
            .map((meta: IProgramMeta): string => meta.node.string);
         assert.deepEqual(actualLocalStringPrograms, ['b.property+c.property', 'd.property']);
      });
      it('Check second child programs', () => {
         const actualLocalStringPrograms = secondChild.getOwnPrograms()
            .map((meta: IProgramMeta): string => meta.node.string);
         assert.deepEqual(actualLocalStringPrograms, ['e.property']);
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
            assert.deepEqual(global.getOwnIdentifiers(), ['a']);
         });
         it('Check first child identifiers', () => {
            assert.deepEqual(firstChild.getOwnIdentifiers(), ['a']);
         });
         it('Check second child identifiers', () => {
            assert.deepEqual(secondChild.getOwnIdentifiers(), ['a']);
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
            const actualLocalStringPrograms = global.getOwnPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
         });
         it('Check first child programs', () => {
            const actualLocalStringPrograms = firstChild.getOwnPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
         });
         it('Check second child programs', () => {
            const actualLocalStringPrograms = secondChild.getOwnPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
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
            assert.deepEqual(global.getOwnIdentifiers(), ['a']);
         });
         it('Check first child identifiers', () => {
            assert.deepEqual(firstChild.getOwnIdentifiers(), ['a']);
         });
         it('Check second child identifiers', () => {
            assert.deepEqual(secondChild.getOwnIdentifiers(), ['a']);
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
            const actualLocalStringPrograms = global.getOwnPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
         });
         it('Check first child programs', () => {
            const actualLocalStringPrograms = firstChild.getOwnPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
         });
         it('Check second child programs', () => {
            const actualLocalStringPrograms = secondChild.getOwnPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
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
               type: ContextType.ISOLATED
            });
            secondChild = global.createContext({
               type: ContextType.ISOLATED
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
            assert.deepEqual(global.getOwnIdentifiers(), [ 'a', 'c', 'e' ]);
         });
         it('Check first child identifiers', () => {
            assert.deepEqual(firstChild.getOwnIdentifiers(), ['c']);
         });
         it('Check second child identifiers', () => {
            assert.deepEqual(secondChild.getOwnIdentifiers(), ['e']);
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
            const actualLocalStringPrograms = global.getOwnPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
         });
         it('Check first child programs', () => {
            const actualLocalStringPrograms = firstChild.getOwnPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualLocalStringPrograms, ['c.d']);
         });
         it('Check second child programs', () => {
            const actualLocalStringPrograms = secondChild.getOwnPrograms()
               .map((meta: IProgramMeta): string => meta.node.string);
            assert.deepEqual(actualLocalStringPrograms, ['e.f']);
         });
      });
   });
});
