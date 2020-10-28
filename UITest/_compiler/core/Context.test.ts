import { createGlobalContext } from 'UI/_builder/Tmpl/core/Context';
import { Parser } from 'UI/_builder/Tmpl/expressions/_private/Parser';
import { ProgramNode } from 'UI/_builder/Tmpl/expressions/_private/Nodes';
import { assert } from 'chai';

// TODO: UI/_builder/Tmpl/* -> Compiler/*

function parse(source: string): ProgramNode {
   return new Parser().parse(source);
}

describe('Compiler/core/Context', () => {
   describe('Global context', () => {
      it('Declare and check identifiers/local identifiers', () => {
         const global = createGlobalContext();
         const identifiers = [
            'identifier_1',
            'identifier_2',
            'identifier_3'
         ];
         identifiers.forEach((identifier: string) => {
            global.declareIdentifier(identifier);
         });
         assert.deepEqual(global.getIdentifiers(), identifiers);
         assert.deepEqual(global.getLocalIdentifiers(), identifiers);
      });
      it('Declare and check duplicate identifiers', () => {
         const global = createGlobalContext();
         global.declareIdentifier('identifier');
         try {
            global.declareIdentifier('identifier');
         } catch (error) {
            assert.strictEqual(error.message, 'Переменная "identifier" уже определена');
            return;
         }
         throw new Error('Двойное объявление идентификатора должно завершиться ошибкой');
      });
      it('Declare and check forbidden identifiers', () => {
         const global = createGlobalContext();
         global.declareIdentifier('_options');
         assert.isEmpty(global.getIdentifiers());
      });
      it('Register and check programs/local programs', () => {
         const global = createGlobalContext();
         const programs = [
            parse('program_1'),
            parse('program_2'),
            parse('program_3')
         ];
         programs.forEach((program: ProgramNode) => {
            global.registerProgram(program);
         });
         assert.deepEqual(global.getPrograms(), programs);
         assert.deepEqual(global.getLocalPrograms(), programs);
      });
      it('Register and check duplicate programs/local programs', () => {
         const global = createGlobalContext();
         const programs = [
            parse('program_1'),
            parse('program_2'),
            parse('program_3')
         ];
         programs.forEach((program: ProgramNode) => {
            global.registerProgram(program);
            global.registerProgram(program);
         });
         assert.deepEqual(global.getPrograms(), programs);
         assert.deepEqual(global.getLocalPrograms(), programs);
      });
      it('Register and check bind/mutable programs/local programs', () => {
         const global = createGlobalContext();
         const programs = [
            parse('"value_1"|bind'),
            parse('"value_2"|mutable')
         ];
         programs.forEach((program: ProgramNode) => {
            global.registerProgram(program);
         });
         assert.isEmpty(global.getPrograms());
         assert.isEmpty(global.getLocalPrograms());
      });
      it('Register and literal programs/local programs', () => {
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
         assert.isEmpty(global.getLocalPrograms());
      });
      it('Register and check programs and identifiers with forbidden identifiers/local identifiers', () => {
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
         assert.isEmpty(global.getLocalIdentifiers());
      });
      it('Register and check programs keys/local program keys', () => {
         const global = createGlobalContext();
         const programs = [
            parse('program_1'),
            parse('program_2'),
            parse('program_3')
         ];
         const programKeys = [
            '_$e0',
            '_$e1',
            '_$e2',
         ];
         programs.forEach((program: ProgramNode) => {
            global.registerProgram(program);
         });
         assert.deepEqual(global.getProgramKeys(), programKeys);
         assert.deepEqual(global.getLocalProgramKeys(), programKeys);
      });
      it('Register program and check program by key', () => {
         const global = createGlobalContext();
         const programs = [
            parse('program_1'),
            parse('program_2'),
            parse('program_3')
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
      it('Register identifiers/programs and check identifiers', () => {
         const global = createGlobalContext();
         const identifiers = [
            'identifier_1',
            'identifier_2',
            'identifier_3'
         ];
         identifiers.forEach((identifier: string) => {
            global.declareIdentifier(identifier);
         });
         const programs = [
            parse('identifier_1'),
            parse('identifier_3[identifier_2].property'),
            parse('identifier_4.handler(1, identifier_5) + identifier_6')
         ];
         programs.forEach((program: ProgramNode) => {
            global.registerProgram(program);
         });
         const standardIdentifiers = [
            'identifier_1',
            'identifier_2',
            'identifier_3',
            'identifier_4',
            'identifier_5',
            'identifier_6'
         ];
         assert.deepEqual(global.getIdentifiers(), standardIdentifiers);
      });
      it('Register bind program and check programs/local programs', () => {
         const global = createGlobalContext();
         const bindProgram = parse('identifier.field.property.value');
         global.registerBindProgram(bindProgram);
         const identifiers = [
            'identifier'
         ];
         const stringPrograms = [
            'identifier.field.property',
            'identifier.field.property.value'
         ];
         assert.deepEqual(global.getIdentifiers(), identifiers);
         const actualStringPrograms = global.getPrograms().map((program: ProgramNode) => program.string);
         const actualStringLocalPrograms = global.getLocalPrograms().map((program: ProgramNode) => program.string);
         assert.deepEqual(actualStringPrograms, stringPrograms);
         assert.deepEqual(actualStringLocalPrograms, stringPrograms);
      });
      it('Register bind program and check programs/local programs', () => {
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
         assert.isEmpty(global.getLocalPrograms());
      });
   });
   describe('Nested context', () => {
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
