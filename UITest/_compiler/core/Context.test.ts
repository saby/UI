import { createGlobalContext, ILexicalContext } from 'UI/_builder/Tmpl/core/Context';
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
         let global: ILexicalContext;
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
               '$p1',
               '$p3',
               '$p5',
               '$p6'
            ];
            assert.deepEqual(returnedKeys, standardKeys);
         });
         it('Check program keys', () => {
            const standardKeys = [
               '$p0',
               '$p1',
               '$p2',
               '$p3',
               '$p4',
               '$p5',
               '$p6'
            ];
            assert.deepEqual(global.getLocalProgramKeys(), standardKeys);
            assert.deepEqual(global.getProgramKeys(), standardKeys);
         });
         it('Check identifiers', () => {
            const standardIdentifiers = [
               'a', 'e', 'h', 'j'
            ];
            assert.deepEqual(global.getLocalIdentifiers(), standardIdentifiers);
            assert.deepEqual(global.getIdentifiers(), standardIdentifiers);
         });
         it('Check internal programs', () => {
            global.getInternalPrograms().forEach((program: ProgramNode, index: number): void => {
               assert.strictEqual(program.string, stringPrograms[index]);
            });
         });
         it('Check programs', () => {
            global.getLocalPrograms().forEach((program: ProgramNode, index: number): void => {
               assert.strictEqual(program.string, stringPrograms[index]);
            });
            global.getPrograms().forEach((program: ProgramNode, index: number): void => {
               assert.strictEqual(program.string, stringPrograms[index]);
            });
         });
         it('Check programs by key', () => {
            const standardKeys = [
               '$p0',
               '$p1',
               '$p2',
               '$p3',
               '$p4',
               '$p5',
               '$p6'
            ];
            standardKeys.forEach((key: string, index: number): void => {
               assert.strictEqual(global.getProgram(key).string, stringPrograms[index]);
            });
         });
      });
      describe('Register event program', () => {
         let global: ILexicalContext;
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
         it('Check program keys', () => {
            assert.isEmpty(global.getLocalProgramKeys());
            assert.isEmpty(global.getProgramKeys());
         });
         it('Check identifiers', () => {
            const standardIdentifiers = [
               'a', 'b', 'h', 'i', 'j', 'm', 'n', 'k'
            ];
            assert.deepEqual(global.getLocalIdentifiers(), standardIdentifiers);
            assert.deepEqual(global.getIdentifiers(), standardIdentifiers);
         });
         it('Check internal programs', () => {
            assert.isEmpty(global.getInternalPrograms());
         });
         it('Check programs', () => {
            assert.isEmpty(global.getLocalPrograms());
            assert.isEmpty(global.getPrograms());
         });
      });
      describe('Register float program', () => {
         let global: ILexicalContext;
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
         it('Check program keys', () => {
            assert.isEmpty(global.getLocalProgramKeys());
            assert.isEmpty(global.getProgramKeys());
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
            assert.deepEqual(global.getLocalIdentifiers(), standardIdentifiers);
            assert.deepEqual(global.getIdentifiers(), standardIdentifiers);
         });
         it('Check internal programs', () => {
            assert.isEmpty(global.getInternalPrograms());
         });
         it('Check programs', () => {
            assert.isEmpty(global.getLocalPrograms());
            assert.isEmpty(global.getPrograms());
         });
      });
      describe('Register program', () => {
         let global: ILexicalContext;
         let programs: ProgramNode[];
         let returnedKeys: string[];

         before(() => {
            global = createGlobalContext();
            const stringPrograms = [
               'a.b + c(d)',
               'e.f[g.h || i] === j',
               'k ? m + 1 : n / 2'
            ];
            programs = stringPrograms.map((stringProgram: string): ProgramNode => parse(stringProgram));
            returnedKeys = programs.map((program: ProgramNode): string => global.registerProgram(program));
         });
         it('Check returned keys', () => {
            const standardKeys = [
               '$p0',
               '$p1',
               '$p2'
            ];
            assert.deepEqual(returnedKeys, standardKeys);
         });
         it('Check program keys', () => {
            const standardKeys = [
               '$p0',
               '$p1',
               '$p2'
            ];
            assert.deepEqual(global.getLocalProgramKeys(), standardKeys);
            assert.deepEqual(global.getProgramKeys(), standardKeys);
         });
         it('Check identifiers', () => {
            const standardIdentifiers = [
               'a', 'c', 'd', 'e', 'g', 'i', 'j', 'k', 'n', 'm'
            ];
            assert.deepEqual(global.getLocalIdentifiers(), standardIdentifiers);
            assert.deepEqual(global.getIdentifiers(), standardIdentifiers);
         });
         it('Check internal programs', () => {
            assert.deepEqual(global.getInternalPrograms(), programs);
         });
         it('Check programs', () => {
            assert.deepEqual(global.getLocalPrograms(), programs);
            assert.deepEqual(global.getPrograms(), programs);
         });
         it('Check programs by key', () => {
            returnedKeys.forEach((key: string, index: number): void => {
               const program = programs[index];
               assert.strictEqual(global.getProgram(key), program);
            });
         });
      });
   });
   describe('Nested context with programs', () => {
      describe('Simple child context', () => {
         let global: ILexicalContext;
         let child: ILexicalContext;
         let programs: ProgramNode[];
         let returnedKeys: string[];

         before(() => {
            global = createGlobalContext();
            child = global.createContext();
            const stringPrograms = [
               'a.b + c(d)',
               'e.f[g.h || i] === j',
               'k ? m + 1 : n / 2'
            ];
            programs = stringPrograms.map((stringProgram: string): ProgramNode => parse(stringProgram));
            returnedKeys = programs.map((program: ProgramNode): string => child.registerProgram(program));
         });
         it('Check returned keys', () => {
            const standardKeys = [
               '$p0',
               '$p1',
               '$p2'
            ];
            assert.deepEqual(returnedKeys, standardKeys);
         });
         it('Check global program keys', () => {
            const standardKeys = [
               '$p0',
               '$p1',
               '$p2'
            ];
            assert.deepEqual(global.getLocalProgramKeys(), standardKeys);
            assert.deepEqual(global.getProgramKeys(), standardKeys);
         });
         // it('Check child program keys', () => {
         //    const standardKeys = [
         //       '$p0',
         //       '$p1',
         //       '$p2'
         //    ];
         //    assert.isEmpty(child.getLocalProgramKeys());
         //    assert.deepEqual(child.getProgramKeys(), standardKeys);
         // });
         it('Check global identifiers', () => {
            const standardIdentifiers = [
               'a', 'c', 'd', 'e', 'g', 'i', 'j', 'k', 'n', 'm'
            ];
            assert.deepEqual(global.getLocalIdentifiers(), standardIdentifiers);
            assert.deepEqual(global.getIdentifiers(), standardIdentifiers);
         });
         it('Check child identifiers', () => {
            const standardIdentifiers = [
               'a', 'c', 'd', 'e', 'g', 'i', 'j', 'k', 'n', 'm'
            ];
            assert.isEmpty(child.getLocalIdentifiers());
            assert.deepEqual(child.getIdentifiers(), standardIdentifiers);
         });
         it('Check global internal programs', () => {
            assert.deepEqual(global.getInternalPrograms(), programs);
         });
         it('Check child internal programs', () => {
            assert.deepEqual(child.getInternalPrograms(), programs);
         });
         it('Check global programs', () => {
            assert.deepEqual(global.getLocalPrograms(), programs);
            assert.deepEqual(global.getPrograms(), programs);
         });
         // it('Check child programs', () => {
         //    assert.isEmpty(child.getLocalPrograms());
         //    assert.deepEqual(child.getPrograms(), programs);
         // });
         it('Check global programs by key', () => {
            returnedKeys.forEach((key: string, index: number): void => {
               const program = programs[index];
               assert.strictEqual(global.getProgram(key), program);
            });
         });
         it('Check child programs by key', () => {
            returnedKeys.forEach((key: string, index: number): void => {
               const program = programs[index];
               assert.strictEqual(child.getProgram(key), program);
            });
         });
      });
      describe('Child context with identifiers', () => {
         let global: ILexicalContext;
         let child: ILexicalContext;
         let programs: ProgramNode[];
         let returnedKeys: string[];

         before(() => {
            global = createGlobalContext();
            child = global.createContext({
               identifiers: ['b']
            });
            const stringPrograms = [
               'a',
               'b.c',
               'b.d + e',
            ];
            // $p0 -> 'a'
            // $p1 -> 'b.c'
            // $p2 -> 'e'
            // $p3 -> 'b.d + e'
            programs = stringPrograms.map((stringProgram: string): ProgramNode => parse(stringProgram));
            returnedKeys = programs.map((program: ProgramNode): string => child.registerProgram(program));
         });
         it('Check returned keys', () => {
            const standardKeys = [
               '$p0',
               '$p1',
               '$p3'
            ];
            assert.deepEqual(returnedKeys, standardKeys);
         });
         it('Check global program keys', () => {
            assert.deepEqual(global.getLocalProgramKeys(), ['$p0', '$p2']);
            assert.deepEqual(global.getProgramKeys(), ['$p0', '$p2']);
         });
         // it('Check child program keys', () => {
         //    assert.deepEqual(child.getLocalProgramKeys(), ['$p1', '$p3']);
         //    assert.deepEqual(child.getProgramKeys(), ['$p0', '$p2', '$p1', '$p3']);
         // });
         it('Check global identifiers', () => {
            assert.deepEqual(global.getLocalIdentifiers(), ['a', 'e']);
            assert.deepEqual(global.getIdentifiers(), ['a', 'e']);
         });
         it('Check child identifiers', () => {
            assert.deepEqual(child.getLocalIdentifiers(), ['b']);
            assert.deepEqual(child.getIdentifiers(), ['a', 'e', 'b']);
         });
         it('Check global internal programs', () => {
            const stringInternalPrograms = [
               'a',
               'e'
            ];
            const actualStringInternalPrograms = global.getInternalPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check child internal programs', () => {
            const stringInternalPrograms = [
               'a',
               'b.c',
               'b.d+e'
            ];
            const actualStringInternalPrograms = child.getInternalPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check global programs', () => {
            const globalStringPrograms = ['a', 'e'];
            global.getLocalPrograms().forEach((program: ProgramNode, index: number): void => {
               const stringProgram = globalStringPrograms[index];
               assert.strictEqual(program.string, stringProgram);
            });
            const localStringPrograms = ['a', 'e'];
            global.getPrograms().forEach((program: ProgramNode, index: number): void => {
               const stringProgram = localStringPrograms[index];
               assert.strictEqual(program.string, stringProgram);
            });
         });
         // it('Check child programs', () => {
         //    const globalStringPrograms = ['b.c', 'b.d+e'];
         //    child.getLocalPrograms().forEach((program: ProgramNode, index: number): void => {
         //       const stringProgram = globalStringPrograms[index];
         //       assert.strictEqual(program.string, stringProgram);
         //    });
         //    const localStringPrograms = ['a', 'e', 'b.c', 'b.d+e'];
         //    child.getPrograms().forEach((program: ProgramNode, index: number): void => {
         //       const stringProgram = localStringPrograms[index];
         //       assert.strictEqual(program.string, stringProgram);
         //    });
         // });
         it('Check global programs by key', () => {
            const globalKeys = ['$p0', '$p2'];
            const stringPrograms = ['a', 'e'];
            globalKeys.forEach((key: string, index: number): void => {
               const stringProgram = stringPrograms[index];
               assert.strictEqual(global.getProgram(key).string, stringProgram);
            });
         });
         it('Check child programs by key', () => {
            const childKeys = ['$p0', '$p1', '$p2', '$p3'];
            const stringPrograms = ['a', 'b.c', 'e', 'b.d+e'];
            childKeys.forEach((key: string, index: number): void => {
               const stringProgram = stringPrograms[index];
               assert.strictEqual(child.getProgram(key).string, stringProgram);
            });
         });
      });
   });
   describe('Nested context with float programs', () => {
      describe('Simple child context', () => {
         let global: ILexicalContext;
         let child: ILexicalContext;

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
         it('Check global program keys', () => {
            const standardKeys = [
               '$p0', '$p1', '$p2', '$p3', '$p4', '$p5'
            ];
            assert.deepEqual(global.getLocalProgramKeys(), standardKeys);
            assert.deepEqual(global.getProgramKeys(), standardKeys);
         });
         it('Check child program keys', () => {
            const standardKeys = [
               '$p0', '$p1', '$p2', '$p3', '$p4', '$p5'
            ];
            assert.isEmpty(child.getLocalProgramKeys());
            assert.deepEqual(child.getProgramKeys(), standardKeys);
         });
         it('Check global identifiers', () => {
            const standardIdentifiers = [
               'a', 'b', 'c', 'e', 'f', 'i'
            ];
            assert.deepEqual(global.getLocalIdentifiers(), standardIdentifiers);
            assert.deepEqual(global.getIdentifiers(), standardIdentifiers);
         });
         it('Check child identifiers', () => {
            const standardIdentifiers = [
               'a', 'b', 'c', 'e', 'f', 'i'
            ];
            assert.deepEqual(child.getLocalIdentifiers(), standardIdentifiers);
            assert.deepEqual(child.getIdentifiers(), standardIdentifiers);
         });
         it('Check global internal programs', () => {
            const stringInternalPrograms = [
               'a', 'b', 'c', 'e', 'f', 'i'
            ];
            const actualStringInternalPrograms = global.getInternalPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check child internal programs', () => {
            assert.isEmpty(child.getInternalPrograms());
         });
         it('Check global programs', () => {
            const stringPrograms = [
               'a', 'b', 'c', 'e', 'f', 'i'
            ];
            const actualLocalStringPrograms = global.getLocalPrograms()
               .map((program: ProgramNode): string => program.string);
            const actualStringPrograms = global.getPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualLocalStringPrograms, stringPrograms);
            assert.deepEqual(actualStringPrograms, stringPrograms);
         });
         it('Check child programs', () => {
            const stringPrograms = [
               'a', 'b', 'c', 'e', 'f', 'i'
            ];
            const actualStringPrograms = child.getPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.isEmpty(child.getLocalPrograms());
            assert.deepEqual(actualStringPrograms, stringPrograms);
         });
         it('Check global programs by key', () => {
            const standardKeys = [
               '$p0', '$p1', '$p2', '$p3', '$p4', '$p5'
            ];
            const stringPrograms = [
               'a', 'b', 'c', 'e', 'f', 'i'
            ];
            standardKeys.forEach((key: string, index: number): void => {
               const stringProgram = stringPrograms[index];
               assert.strictEqual(global.getProgram(key).string, stringProgram);
            });
         });
         it('Check child programs by key', () => {
            const standardKeys = [
               '$p0', '$p1', '$p2', '$p3', '$p4', '$p5'
            ];
            const stringPrograms = [
               'a', 'b', 'c', 'e', 'f', 'i'
            ];
            standardKeys.forEach((key: string, index: number): void => {
               const stringProgram = stringPrograms[index];
               assert.strictEqual(child.getProgram(key).string, stringProgram);
            });
         });
      });
      describe('Child context with identifiers', () => {
         let global: ILexicalContext;
         let child: ILexicalContext;

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
         it('Check global program keys', () => {
            const standardKeys = [
               '$p0', '$p1', '$p2', '$p3', '$p4'
            ];
            assert.deepEqual(global.getLocalProgramKeys(), standardKeys);
            assert.deepEqual(global.getProgramKeys(), standardKeys);
         });
         it('Check child program keys', () => {
            const standardKeys = [
               '$p0', '$p1', '$p2', '$p3', '$p4'
            ];
            assert.isEmpty(child.getLocalProgramKeys());
            assert.deepEqual(child.getProgramKeys(), standardKeys);
         });
         it('Check global identifiers', () => {
            const standardIdentifiers = [
               'a', 'b', 'e', 'f', 'i'
            ];
            assert.deepEqual(global.getLocalIdentifiers(), standardIdentifiers);
            assert.deepEqual(global.getIdentifiers(), standardIdentifiers);
         });
         it('Check child identifiers', () => {
            const standardIdentifiers = [
               'c', 'a', 'b', 'e', 'f', 'i'
            ];
            assert.deepEqual(child.getLocalIdentifiers(), standardIdentifiers);
            assert.deepEqual(child.getIdentifiers(), standardIdentifiers);
         });
         it('Check global internal programs', () => {
            const stringInternalPrograms = [
               'a', 'b', 'e', 'f', 'i'
            ];
            const actualStringInternalPrograms = global.getInternalPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check child internal programs', () => {
            assert.isEmpty(child.getInternalPrograms());
         });
         it('Check global programs', () => {
            const stringPrograms = [
               'a', 'b', 'e', 'f', 'i'
            ];
            const actualLocalStringPrograms = global.getLocalPrograms()
               .map((program: ProgramNode): string => program.string);
            const actualStringPrograms = global.getPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualLocalStringPrograms, stringPrograms);
            assert.deepEqual(actualStringPrograms, stringPrograms);
         });
         it('Check child programs', () => {
            const stringPrograms = [
               'a', 'b', 'e', 'f', 'i'
            ];
            const actualStringPrograms = child.getPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.isEmpty(child.getLocalPrograms());
            assert.deepEqual(actualStringPrograms, stringPrograms);
         });
         it('Check global programs by key', () => {
            const standardKeys = [
               '$p0', '$p1', '$p2', '$p3', '$p4'
            ];
            const stringPrograms = [
               'a', 'b', 'e', 'f', 'i'
            ];
            standardKeys.forEach((key: string, index: number): void => {
               const stringProgram = stringPrograms[index];
               assert.strictEqual(global.getProgram(key).string, stringProgram);
            });
         });
         it('Check child programs by key', () => {
            const standardKeys = [
               '$p0', '$p1', '$p2', '$p3', '$p4'
            ];
            const stringPrograms = [
               'a', 'b', 'e', 'f', 'i'
            ];
            standardKeys.forEach((key: string, index: number): void => {
               const stringProgram = stringPrograms[index];
               assert.strictEqual(child.getProgram(key).string, stringProgram);
            });
         });
      });
   });
   describe('Isolated context with programs', () => {
      describe('Simple child context', () => {
         let global: ILexicalContext;
         let child: ILexicalContext;
         let programs: ProgramNode[];
         let returnedKeys: string[];

         before(() => {
            global = createGlobalContext();
            child = global.createContext({
               allowHoisting: false
            });
            const stringPrograms = [
               'a.b + c(d)',
               'e.f[g.h || i] === j',
               'k ? m + 1 : n / 2'
            ];
            programs = stringPrograms.map((stringProgram: string): ProgramNode => parse(stringProgram));
            returnedKeys = programs.map((program: ProgramNode): string => child.registerProgram(program));
         });
         it('Check returned keys', () => {
            const standardKeys = [
               '$p0',
               '$p1',
               '$p2'
            ];
            assert.deepEqual(returnedKeys, standardKeys);
         });
         it('Check global program keys', () => {
            assert.isEmpty(global.getLocalProgramKeys());
            assert.isEmpty(global.getProgramKeys());
         });
         it('Check child program keys', () => {
            const standardKeys = [
               '$p0',
               '$p1',
               '$p2'
            ];
            assert.deepEqual(child.getLocalProgramKeys(), standardKeys);
            assert.deepEqual(child.getProgramKeys(), standardKeys);
         });
         it('Check global identifiers', () => {
            assert.isEmpty(global.getLocalIdentifiers());
            assert.isEmpty(global.getIdentifiers());
         });
         it('Check child identifiers', () => {
            const standardIdentifiers = [
               'a', 'c', 'd', 'e', 'g', 'i', 'j', 'k', 'n', 'm'
            ];
            assert.deepEqual(child.getLocalIdentifiers(), standardIdentifiers);
            assert.deepEqual(child.getIdentifiers(), standardIdentifiers);
         });
         it('Check global internal programs', () => {
            assert.isEmpty(global.getInternalPrograms());
         });
         it('Check child internal programs', () => {
            assert.deepEqual(child.getInternalPrograms(), programs);
         });
         it('Check global programs', () => {
            assert.isEmpty(global.getLocalPrograms());
            assert.isEmpty(global.getPrograms());
         });
         it('Check child programs', () => {
            assert.deepEqual(child.getLocalPrograms(), programs);
            assert.deepEqual(child.getPrograms(), programs);
         });
         it('Check global programs by key', () => {
            returnedKeys.forEach((key: string): void => {
               try {
                  global.getProgram(key);
               } catch (error) {
                  assert.strictEqual(error.message, `Выражение с ключом "${key}" не было зарегистрировано`);
                  return;
               }
               throw new Error(`Выражение с ключом "${key}" не должно существовать в глобальном контексте`);
            });
         });
         it('Check child programs by key', () => {
            returnedKeys.forEach((key: string, index: number): void => {
               const program = programs[index];
               assert.strictEqual(child.getProgram(key), program);
            });
         });
      });
      describe('Child context with identifiers', () => {
         let global: ILexicalContext;
         let child: ILexicalContext;
         let programs: ProgramNode[];
         let returnedKeys: string[];

         before(() => {
            global = createGlobalContext();
            child = global.createContext({
               allowHoisting: false,
               identifiers: ['b']
            });
            const stringPrograms = [
               'a',
               'b.c',
               'b.d + e',
            ];
            programs = stringPrograms.map((stringProgram: string): ProgramNode => parse(stringProgram));
            returnedKeys = programs.map((program: ProgramNode): string => child.registerProgram(program));
         });
         it('Check returned keys', () => {
            const standardKeys = [
               '$p0',
               '$p1',
               '$p2'
            ];
            assert.deepEqual(returnedKeys, standardKeys);
         });
         it('Check global program keys', () => {
            assert.isEmpty(global.getLocalProgramKeys());
            assert.isEmpty(global.getProgramKeys());
         });
         it('Check child program keys', () => {
            const programKeys = ['$p0', '$p1', '$p2'];
            assert.deepEqual(child.getLocalProgramKeys(), programKeys);
            assert.deepEqual(child.getProgramKeys(), programKeys);
         });
         it('Check global identifiers', () => {
            assert.isEmpty(global.getLocalIdentifiers());
            assert.isEmpty(global.getIdentifiers());
         });
         it('Check child identifiers', () => {
            const identifiers = ['b', 'a', 'e'];
            assert.deepEqual(child.getLocalIdentifiers(), identifiers);
            assert.deepEqual(child.getIdentifiers(), identifiers);
         });
         it('Check global internal programs', () => {
            assert.isEmpty(global.getInternalPrograms());
         });
         it('Check child internal programs', () => {
            const stringInternalPrograms = [
               'a',
               'b.c',
               'b.d+e',
            ];
            const actualStringInternalPrograms = child.getInternalPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check global programs', () => {
            assert.isEmpty(global.getLocalPrograms());
            assert.isEmpty(global.getPrograms());
         });
         it('Check child programs', () => {
            const stringPrograms = [
               'a',
               'b.c',
               'b.d+e',
            ];
            child.getLocalPrograms().forEach((program: ProgramNode, index: number): void => {
               const stringProgram = stringPrograms[index];
               assert.strictEqual(program.string, stringProgram);
            });
            child.getPrograms().forEach((program: ProgramNode, index: number): void => {
               const stringProgram = stringPrograms[index];
               assert.strictEqual(program.string, stringProgram);
            });
         });
         it('Check global programs by key', () => {
            returnedKeys.forEach((key: string): void => {
               try {
                  global.getProgram(key);
               } catch (error) {
                  assert.strictEqual(error.message, `Выражение с ключом "${key}" не было зарегистрировано`);
                  return;
               }
               throw new Error(`Выражение с ключом "${key}" не должно существовать в глобальном контексте`);
            });
         });
         it('Check child programs by key', () => {
            returnedKeys.forEach((key: string, index: number): void => {
               const program = programs[index];
               assert.strictEqual(child.getProgram(key), program);
            });
         });
      });
   });
   describe('Intersections', () => {
      describe('Nested', () => {
         let global: ILexicalContext;
         let firstChild: ILexicalContext;
         let secondChild: ILexicalContext;
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
               '$p0',
               '$p1',
               '$p2'
            ];
            assert.deepEqual(returnedKeys, standardKeys);
         });
         it('Check global program keys', () => {
            assert.deepEqual(global.getLocalProgramKeys(), ['$p0']);
            assert.deepEqual(global.getProgramKeys(), ['$p0']);
         });
         it('Check first child program keys', () => {
            assert.deepEqual(firstChild.getLocalProgramKeys(), ['$p1']);
            assert.deepEqual(firstChild.getProgramKeys(), ['$p0', '$p1']);
         });
         it('Check second child program keys', () => {
            assert.deepEqual(secondChild.getLocalProgramKeys(), ['$p2']);
            assert.deepEqual(secondChild.getProgramKeys(), ['$p0', '$p1', '$p2']);
         });
         it('Check global identifiers', () => {
            assert.deepEqual(global.getLocalIdentifiers(), ['a']);
            assert.deepEqual(global.getIdentifiers(), ['a']);
         });
         it('Check first child identifiers', () => {
            assert.deepEqual(firstChild.getLocalIdentifiers(), ['a']);
            assert.deepEqual(firstChild.getIdentifiers(), ['a']);
         });
         it('Check second child identifiers', () => {
            assert.deepEqual(secondChild.getLocalIdentifiers(), ['a']);
            assert.deepEqual(secondChild.getIdentifiers(), ['a']);
         });
         it('Check global internal programs', () => {
            const stringInternalPrograms = ['a.b'];
            const actualStringInternalPrograms = global.getInternalPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check first child internal programs', () => {
            const stringInternalPrograms = ['a.b'];
            const actualStringInternalPrograms = firstChild.getInternalPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check second child internal programs', () => {
            const stringInternalPrograms = ['a.b'];
            const actualStringInternalPrograms = secondChild.getInternalPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check global programs', () => {
            const actualLocalStringPrograms = global.getLocalPrograms()
               .map((program: ProgramNode): string => program.string);
            const actualStringPrograms = global.getPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
            assert.deepEqual(actualStringPrograms, ['a.b']);
         });
         it('Check first child programs', () => {
            const actualLocalStringPrograms = firstChild.getLocalPrograms()
               .map((program: ProgramNode): string => program.string);
            const actualStringPrograms = firstChild.getPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
            assert.deepEqual(actualStringPrograms, ['a.b', 'a.b']);
         });
         it('Check second child programs', () => {
            const actualLocalStringPrograms = secondChild.getLocalPrograms()
               .map((program: ProgramNode): string => program.string);
            const actualStringPrograms = secondChild.getPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
            assert.deepEqual(actualStringPrograms, ['a.b', 'a.b', 'a.b']);
         });
         it('Check global programs by key', () => {
            const unreachableKeys = ['$p1', '$p2'];
            assert.strictEqual(global.getProgram('$p0').string, 'a.b');
            unreachableKeys.forEach((key: string): void => {
               try {
                  global.getProgram(key);
               } catch (error) {
                  assert.strictEqual(error.message, `Выражение с ключом "${key}" не было зарегистрировано`);
                  return;
               }
               throw new Error(`Выражение с ключом "${key}" не должно существовать в данном контексте`);
            });
         });
         it('Check first child programs by key', () => {
            const unreachableKeys = ['$p2'];
            assert.strictEqual(firstChild.getProgram('$p0').string, 'a.b');
            assert.strictEqual(firstChild.getProgram('$p1').string, 'a.b');
            unreachableKeys.forEach((key: string): void => {
               try {
                  firstChild.getProgram(key);
               } catch (error) {
                  assert.strictEqual(error.message, `Выражение с ключом "${key}" не было зарегистрировано`);
                  return;
               }
               throw new Error(`Выражение с ключом "${key}" не должно существовать в данном контексте`);
            });
         });
         it('Check second child programs by key', () => {
            assert.strictEqual(secondChild.getProgram('$p0').string, 'a.b');
            assert.strictEqual(secondChild.getProgram('$p1').string, 'a.b');
            assert.strictEqual(secondChild.getProgram('$p2').string, 'a.b');
         });
      });
      describe('Sibling', () => {
         let global: ILexicalContext;
         let firstChild: ILexicalContext;
         let secondChild: ILexicalContext;
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
               '$p0',
               '$p1',
               '$p2'
            ];
            assert.deepEqual(returnedKeys, standardKeys);
         });
         it('Check global program keys', () => {
            assert.deepEqual(global.getLocalProgramKeys(), ['$p0']);
            assert.deepEqual(global.getProgramKeys(), ['$p0']);
         });
         it('Check first child program keys', () => {
            assert.deepEqual(firstChild.getLocalProgramKeys(), ['$p1']);
            assert.deepEqual(firstChild.getProgramKeys(), ['$p0', '$p1']);
         });
         it('Check second child program keys', () => {
            assert.deepEqual(secondChild.getLocalProgramKeys(), ['$p2']);
            assert.deepEqual(secondChild.getProgramKeys(), ['$p0', '$p2']);
         });
         it('Check global identifiers', () => {
            assert.deepEqual(global.getLocalIdentifiers(), ['a']);
            assert.deepEqual(global.getIdentifiers(), ['a']);
         });
         it('Check first child identifiers', () => {
            assert.deepEqual(firstChild.getLocalIdentifiers(), ['a']);
            assert.deepEqual(firstChild.getIdentifiers(), ['a']);
         });
         it('Check second child identifiers', () => {
            assert.deepEqual(secondChild.getLocalIdentifiers(), ['a']);
            assert.deepEqual(secondChild.getIdentifiers(), ['a']);
         });
         it('Check global internal programs', () => {
            const stringInternalPrograms = ['a.b'];
            const actualStringInternalPrograms = global.getInternalPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check first child internal programs', () => {
            const stringInternalPrograms = ['a.b'];
            const actualStringInternalPrograms = firstChild.getInternalPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check second child internal programs', () => {
            const stringInternalPrograms = ['a.b'];
            const actualStringInternalPrograms = secondChild.getInternalPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check global programs', () => {
            const actualLocalStringPrograms = global.getLocalPrograms()
               .map((program: ProgramNode): string => program.string);
            const actualStringPrograms = global.getPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
            assert.deepEqual(actualStringPrograms, ['a.b']);
         });
         it('Check first child programs', () => {
            const actualLocalStringPrograms = firstChild.getLocalPrograms()
               .map((program: ProgramNode): string => program.string);
            const actualStringPrograms = firstChild.getPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
            assert.deepEqual(actualStringPrograms, ['a.b', 'a.b']);
         });
         it('Check second child programs', () => {
            const actualLocalStringPrograms = secondChild.getLocalPrograms()
               .map((program: ProgramNode): string => program.string);
            const actualStringPrograms = secondChild.getPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
            assert.deepEqual(actualStringPrograms, ['a.b', 'a.b']);
         });
         it('Check global programs by key', () => {
            const unreachableKeys = ['$p1', '$p2'];
            assert.strictEqual(global.getProgram('$p0').string, 'a.b');
            unreachableKeys.forEach((key: string): void => {
               try {
                  global.getProgram(key);
               } catch (error) {
                  assert.strictEqual(error.message, `Выражение с ключом "${key}" не было зарегистрировано`);
                  return;
               }
               throw new Error(`Выражение с ключом "${key}" не должно существовать в данном контексте`);
            });
         });
         it('Check first child programs by key', () => {
            const unreachableKeys = ['$p2'];
            assert.strictEqual(firstChild.getProgram('$p0').string, 'a.b');
            assert.strictEqual(firstChild.getProgram('$p1').string, 'a.b');
            unreachableKeys.forEach((key: string): void => {
               try {
                  firstChild.getProgram(key);
               } catch (error) {
                  assert.strictEqual(error.message, `Выражение с ключом "${key}" не было зарегистрировано`);
                  return;
               }
               throw new Error(`Выражение с ключом "${key}" не должно существовать в данном контексте`);
            });
         });
         it('Check second child programs by key', () => {
            const unreachableKeys = ['$p1`'];
            assert.strictEqual(secondChild.getProgram('$p0').string, 'a.b');
            assert.strictEqual(secondChild.getProgram('$p2').string, 'a.b');
            unreachableKeys.forEach((key: string): void => {
               try {
                  secondChild.getProgram(key);
               } catch (error) {
                  assert.strictEqual(error.message, `Выражение с ключом "${key}" не было зарегистрировано`);
                  return;
               }
               throw new Error(`Выражение с ключом "${key}" не должно существовать в данном контексте`);
            });
         });
      });
      describe('Isolated', () => {
         let global: ILexicalContext;
         let firstChild: ILexicalContext;
         let secondChild: ILexicalContext;
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
               firstChild.registerProgram(parse('a.b')),
               secondChild.registerProgram(parse('a.b'))
            ];
         });
         it('Check returned keys', () => {
            const standardKeys = [
               '$p0',
               '$p1',
               '$p2'
            ];
            assert.deepEqual(returnedKeys, standardKeys);
         });
         it('Check global program keys', () => {
            assert.deepEqual(global.getLocalProgramKeys(), ['$p0']);
            assert.deepEqual(global.getProgramKeys(), ['$p0']);
         });
         it('Check first child program keys', () => {
            assert.deepEqual(firstChild.getLocalProgramKeys(), ['$p1']);
            assert.deepEqual(firstChild.getProgramKeys(), ['$p1']);
         });
         it('Check second child program keys', () => {
            assert.deepEqual(secondChild.getLocalProgramKeys(), ['$p2']);
            assert.deepEqual(secondChild.getProgramKeys(), ['$p2']);
         });
         it('Check global identifiers', () => {
            assert.deepEqual(global.getLocalIdentifiers(), ['a']);
            assert.deepEqual(global.getIdentifiers(), ['a']);
         });
         it('Check first child identifiers', () => {
            assert.deepEqual(firstChild.getLocalIdentifiers(), ['a']);
            assert.deepEqual(firstChild.getIdentifiers(), ['a']);
         });
         it('Check second child identifiers', () => {
            assert.deepEqual(secondChild.getLocalIdentifiers(), ['a']);
            assert.deepEqual(secondChild.getIdentifiers(), ['a']);
         });
         it('Check global internal programs', () => {
            const stringInternalPrograms = ['a.b'];
            const actualStringInternalPrograms = global.getInternalPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check first child internal programs', () => {
            const stringInternalPrograms = ['a.b'];
            const actualStringInternalPrograms = firstChild.getInternalPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check second child internal programs', () => {
            const stringInternalPrograms = ['a.b'];
            const actualStringInternalPrograms = secondChild.getInternalPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
         });
         it('Check global programs', () => {
            const actualLocalStringPrograms = global.getLocalPrograms()
               .map((program: ProgramNode): string => program.string);
            const actualStringPrograms = global.getPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
            assert.deepEqual(actualStringPrograms, ['a.b']);
         });
         it('Check first child programs', () => {
            const actualLocalStringPrograms = firstChild.getLocalPrograms()
               .map((program: ProgramNode): string => program.string);
            const actualStringPrograms = firstChild.getPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
            assert.deepEqual(actualStringPrograms, ['a.b']);
         });
         it('Check second child programs', () => {
            const actualLocalStringPrograms = secondChild.getLocalPrograms()
               .map((program: ProgramNode): string => program.string);
            const actualStringPrograms = secondChild.getPrograms()
               .map((program: ProgramNode): string => program.string);
            assert.deepEqual(actualLocalStringPrograms, ['a.b']);
            assert.deepEqual(actualStringPrograms, ['a.b']);
         });
         it('Check global programs by key', () => {
            const unreachableKeys = ['$p1', '$p2'];
            assert.strictEqual(global.getProgram('$p0').string, 'a.b');
            unreachableKeys.forEach((key: string): void => {
               try {
                  global.getProgram(key);
               } catch (error) {
                  assert.strictEqual(error.message, `Выражение с ключом "${key}" не было зарегистрировано`);
                  return;
               }
               throw new Error(`Выражение с ключом "${key}" не должно существовать в данном контексте`);
            });
         });
         it('Check first child programs by key', () => {
            const unreachableKeys = ['$p0', '$p2'];
            assert.strictEqual(firstChild.getProgram('$p1').string, 'a.b');
            unreachableKeys.forEach((key: string): void => {
               try {
                  firstChild.getProgram(key);
               } catch (error) {
                  assert.strictEqual(error.message, `Выражение с ключом "${key}" не было зарегистрировано`);
                  return;
               }
               throw new Error(`Выражение с ключом "${key}" не должно существовать в данном контексте`);
            });
         });
         it('Check second child programs by key', () => {
            const unreachableKeys = ['$p0', '$p1`'];
            assert.strictEqual(secondChild.getProgram('$p2').string, 'a.b');
            unreachableKeys.forEach((key: string): void => {
               try {
                  secondChild.getProgram(key);
               } catch (error) {
                  assert.strictEqual(error.message, `Выражение с ключом "${key}" не было зарегистрировано`);
                  return;
               }
               throw new Error(`Выражение с ключом "${key}" не должно существовать в данном контексте`);
            });
         });
      });
   });
   describe('Join isolated context', () => {
      let global: ILexicalContext;
      let firstChild: ILexicalContext;
      let secondChild: ILexicalContext;
      let returnedKeys: string[];

      // <@global>
      //   {{ a.property }}                  # $p0
      //
      //   <#firstChild>
      //     {{ a.property }}                # $p1
      //     {{ b.property }}                # $p2, $p6
      //     {{ c.property }}                # $p3
      //     {{ d.property + e.property }}   # $p4; 'e' -> $p7
      //   </#firstChild>
      //   <@secondChild join-on="c,d">
      //     {{ f.property }}                # $p5
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
            firstChild.registerProgram(parse('a.property')),
            firstChild.registerProgram(parse('b.property')),
            firstChild.registerProgram(parse('c.property')),
            firstChild.registerProgram(parse('d.property + e.property')),
            secondChild.registerProgram(parse('f.property'))
         ];
         secondChild.joinContext(firstChild, { identifiers: ['c', 'd'] });
      });
      after(() => {
         global.startProcessing();
         const usedProgramKeys = []
            .concat(
               global.getLocalProgramKeys()
            )
            .concat(
               firstChild.getLocalProgramKeys()
            );
         // Second child must have no programs.
         usedProgramKeys.forEach((key: string): void => {
            global.commitProcessing(key);
         });
         global.endProcessing();
      });
      it('Check returned keys', () => {
         const standardKeys = [
            '$p0',
            '$p1',
            '$p2',
            '$p3',
            '$p4',
            '$p5'
         ];
         assert.deepEqual(returnedKeys, standardKeys);
      });
      it('Check global program keys', () => {
         assert.deepEqual(global.getLocalProgramKeys(), ['$p0', '$p5', '$p6', '$p7']);
         assert.deepEqual(global.getProgramKeys(), ['$p0', '$p5', '$p6', '$p7']);
      });
      it('Check first child program keys', () => {
         assert.deepEqual(firstChild.getLocalProgramKeys(), ['$p1', '$p2', '$p3', '$p4']);
         assert.deepEqual(firstChild.getProgramKeys(), ['$p1', '$p2', '$p3', '$p4']);
      });
      // it('Check second child program keys', () => {
      //    assert.isEmpty(secondChild.getLocalProgramKeys());
      //    assert.deepEqual(secondChild.getProgramKeys(), ['$p0', '$p5', '$p6', '$p7']);
      // });
      it('Check global identifiers', () => {
         assert.deepEqual(global.getLocalIdentifiers(), ['a', 'f', 'b', 'e']);
         assert.deepEqual(global.getIdentifiers(), ['a', 'f', 'b', 'e']);
      });
      it('Check first child identifiers', () => {
         assert.deepEqual(firstChild.getLocalIdentifiers(), ['a', 'b', 'c', 'd', 'e']);
         assert.deepEqual(firstChild.getIdentifiers(), ['a', 'b', 'c', 'd', 'e']);
      });
      it('Check second child identifiers', () => {
         assert.isEmpty(secondChild.getLocalIdentifiers());
         assert.deepEqual(secondChild.getIdentifiers(), ['a', 'f', 'b', 'e']);
      });
      it('Check global internal programs', () => {
         const stringInternalPrograms = ['a.property', 'f.property', 'b.property', 'e'];
         const actualStringInternalPrograms = global.getInternalPrograms()
            .map((program: ProgramNode): string => program.string);
         assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
      });
      it('Check first child internal programs', () => {
         const stringInternalPrograms = ['a.property', 'b.property', 'c.property', 'd.property+e.property'];
         const actualStringInternalPrograms = firstChild.getInternalPrograms()
            .map((program: ProgramNode): string => program.string);
         assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
      });
      it('Check second child internal programs', () => {
         const stringInternalPrograms = ['f.property', 'a.property', 'b.property'];
         const actualStringInternalPrograms = secondChild.getInternalPrograms()
            .map((program: ProgramNode): string => program.string);
         assert.deepEqual(actualStringInternalPrograms, stringInternalPrograms);
      });
      it('Check global programs', () => {
         const actualLocalStringPrograms = global.getLocalPrograms()
            .map((program: ProgramNode): string => program.string);
         const actualStringPrograms = global.getPrograms()
            .map((program: ProgramNode): string => program.string);
         assert.deepEqual(actualLocalStringPrograms, ['a.property', 'f.property', 'b.property', 'e']);
         assert.deepEqual(actualStringPrograms, ['a.property', 'f.property', 'b.property', 'e']);
      });
      it('Check first child programs', () => {
         const actualLocalStringPrograms = firstChild.getLocalPrograms()
            .map((program: ProgramNode): string => program.string);
         const actualStringPrograms = firstChild.getPrograms()
            .map((program: ProgramNode): string => program.string);
         assert.deepEqual(actualLocalStringPrograms, ['a.property', 'b.property', 'c.property', 'd.property+e.property']);
         assert.deepEqual(actualStringPrograms, ['a.property', 'b.property', 'c.property', 'd.property+e.property']);
      });
      // it('Check second child programs', () => {
      //    const actualLocalStringPrograms = secondChild.getLocalPrograms()
      //       .map((program: ProgramNode): string => program.string);
      //    const actualStringPrograms = secondChild.getPrograms()
      //       .map((program: ProgramNode): string => program.string);
      //    assert.isEmpty(actualLocalStringPrograms);
      //    assert.deepEqual(actualStringPrograms, ['a.property', 'f.property', 'b.property', 'e']);
      // });
   });
});
