import { createGlobalContext } from 'UI/_builder/Tmpl/core/Context';
import { Parser } from 'UI/_builder/Tmpl/expressions/_private/Parser';
import { ProgramNode } from 'UI/_builder/Tmpl/expressions/_private/Nodes';
import { assert } from 'chai';

// TODO: UI/_builder/Tmpl/* -> Compiler/*

function parse(source: string): ProgramNode {
   return new Parser().parse(source);
}

describe('Compiler/core/Context', () => {
   describe('global', () => {
      it('.declareIdentifier()', () => {
         const global = createGlobalContext();
         const identifiers = [
            'ident1',
            'ident2',
            'ident3'
         ];
         identifiers.forEach((identifier: string) => {
            global.declareIdentifier(identifier);
         });
         assert.deepEqual(global.getIdentifiers(), identifiers);
      });
      it('.declareIdentifier() duplicate', () => {
         const global = createGlobalContext();
         global.declareIdentifier('ident');
         try {
            global.declareIdentifier('ident');
         } catch (error) {
            assert.strictEqual(error.message, 'Переменная "ident" уже определена');
            return;
         }
         throw new Error('Must be failed');
      });
      it('.declareIdentifier() forbidden', () => {
         const global = createGlobalContext();
         global.declareIdentifier('_options');
         assert.isEmpty(global.getIdentifiers());
      });
      it('.registerProgram()', () => {
         const global = createGlobalContext();
         const programs = [
            parse('program1'),
            parse('program2'),
            parse('program3')
         ];
         programs.forEach((program: ProgramNode) => {
            global.registerProgram(program);
         });
         assert.deepEqual(global.getPrograms(), programs);
      });
      it('.registerProgram() duplicate', () => {
         const global = createGlobalContext();
         const programs = [
            parse('program1'),
            parse('program2'),
            parse('program3')
         ];
         programs.forEach((program: ProgramNode) => {
            global.registerProgram(program);
            global.registerProgram(program);
         });
         assert.deepEqual(global.getPrograms(), programs);
      });
      it('.registerProgram() bind/mutable', () => {
         const global = createGlobalContext();
         const programs = [
            parse('"value1"|bind'),
            parse('"value2"|mutable')
         ];
         programs.forEach((program: ProgramNode) => {
            global.registerProgram(program);
         });
         assert.isEmpty(global.getPrograms());
      });
      it('.registerProgram() literals', () => {
         const global = createGlobalContext();
         const programs = [
            parse('true'),
            parse('12.3'),
            parse('[1, 2, 3]'),
            parse('{ "property": "value" }'),
            parse('"string"')
         ];
         programs.forEach((program: ProgramNode) => {
            global.registerProgram(program);
         });
         assert.isEmpty(global.getPrograms());
      });
      it('.registerProgram() forbidden', () => {
         const global = createGlobalContext();
         const programs = [
            parse('_options.value'),
            parse('_children.name'),
            parse('_container.child')
         ];
         programs.forEach((program: ProgramNode) => {
            global.registerProgram(program);
         });
         assert.deepEqual(global.getPrograms(), programs);
         assert.isEmpty(global.getIdentifiers());
      });
      it('.getProgramKeys()', () => {
         const global = createGlobalContext();
         const programs = [
            parse('program1'),
            parse('program2'),
            parse('program3')
         ];
         const identifiers = [
            '_$e0',
            '_$e1',
            '_$e2',
         ];
         programs.forEach((program: ProgramNode) => {
            global.registerProgram(program);
         });
         assert.deepEqual(global.getProgramKeys(), identifiers);
      });
      it('.getProgram()', () => {
         const global = createGlobalContext();
         const programs = [
            parse('program1'),
            parse('program2'),
            parse('program3')
         ];
         const identifiers = [
            '_$e0',
            '_$e1',
            '_$e2',
         ];
         programs.forEach((program: ProgramNode) => {
            global.registerProgram(program);
         });
         for (let index = 0; index < 3; ++index) {
            const id = identifiers[index];
            const program = programs[index];
            assert.strictEqual(global.getProgram(id), program);
         }
      });
      it('.getIdentifiers()', () => {
         const global = createGlobalContext();
         const identifiers = [
            'ident1',
            'ident2',
            'ident3'
         ];
         identifiers.forEach((identifier: string) => {
            global.declareIdentifier(identifier);
         });
         const programs = [
            parse('ident1'),
            parse('ident3[ident2].property'),
            parse('ident4.handler(1, ident5) + ident6')
         ];
         programs.forEach((program: ProgramNode) => {
            global.registerProgram(program);
         });
         const standardIdentifiers = [
            'ident1',
            'ident2',
            'ident3',
            'ident4',
            'ident5',
            'ident6'
         ];
         assert.deepEqual(global.getIdentifiers(), standardIdentifiers);
      });
      it('.registerBindProgram()', () => {
         const global = createGlobalContext();
         const bindProgram = parse('ident.b.c.d');
         global.registerBindProgram(bindProgram);
         const identifiers = [
            'ident'
         ];
         const stringPrograms = [
            'ident.b.c',
            'ident.b.c.d'
         ];
         assert.deepEqual(global.getIdentifiers(), identifiers);
         const actualStringPrograms = global.getPrograms().map((program: ProgramNode) => program.string);
         assert.deepEqual(actualStringPrograms, stringPrograms);
      });
      it('.registerEventProgram()', () => {
         const global = createGlobalContext();
         const bindProgram = parse('a.b.c(d, e.f, g[h])');
         global.registerEventProgram(bindProgram);
         const identifiers = [
            'a',
            'd',
            'e',
            'g',
            'h'
         ];
         assert.deepEqual(global.getIdentifiers(), identifiers);
         assert.isEmpty(global.getPrograms());
      });
   });
   describe('nested scopes', () => {
      it('unique program keys', () => {
         // TODO: hoist program
         // const global = createGlobalContext();
         // global.registerProgram(parse('globalIdent'));
         //
         // const first = global.createContext();
         // first.registerProgram(parse('firstIdent'));
         //
         // const expectedKeys = [
         //    '_$e0',
         //    '_$e1'
         // ];
         // assert.deepEqual(global.getProgramKeys(), expectedKeys);
         // assert.deepEqual(first.getProgramKeys(), expectedKeys);
         //
         // assert.deepEqual(global.getLocalProgramKeys(), expectedKeys);
         // assert.isEmpty(first.getLocalProgramKeys());
      });
      it('.getIdentifiers() global', () => {
         const global = createGlobalContext();
         global.registerProgram(parse('globalIdent'));

         const first = global.createContext();
         first.registerProgram(parse('firstIdent'));

         const expectedIdentifiers = [
            'globalIdent',
            'firstIdent'
         ];
         assert.deepEqual(global.getIdentifiers(), expectedIdentifiers);
         assert.deepEqual(first.getIdentifiers(), expectedIdentifiers);

         assert.deepEqual(global.getLocalIdentifiers(), expectedIdentifiers);
         assert.isEmpty(first.getLocalIdentifiers());
      });
      it('.getIdentifiers() nested', () => {
         const global = createGlobalContext();
         global.declareIdentifier('globalDeclaredIdent');
         global.registerProgram(parse('globalDeclaredIdent + 1'));
         global.registerProgram(parse('globalIdent'));

         const first = global.createContext();
         first.declareIdentifier('firstDeclaredIdent');
         first.registerProgram(parse('firstDeclaredIdent + 1'));
         first.registerProgram(parse('firstIdent'));

         const identifiers = [
            'globalDeclaredIdent',
            'globalIdent',
            'firstIdent',
            'firstDeclaredIdent'
         ];

         assert.deepEqual(global.getIdentifiers(), identifiers.slice(0, 3));
         assert.deepEqual(first.getIdentifiers(), identifiers);

         assert.deepEqual(global.getLocalIdentifiers(), identifiers.slice(0, 3));
         assert.deepEqual(first.getLocalIdentifiers(), identifiers.slice(3));
      });
   });
});
