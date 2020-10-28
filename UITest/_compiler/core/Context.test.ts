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
      it('Declare identifiers', () => {
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
      it('Declare duplicate identifiers', () => {
         const global = createGlobalContext();
         global.declareIdentifier('identifier');
         try {
            global.declareIdentifier('identifier');
         } catch (error) {
            assert.strictEqual(error.message, 'Переменная "identifier" уже определена');
            return;
         }
         throw new Error('Повторное объявление идентификатора должно завершиться ошибкой');
      });
      it('Declare forbidden identifiers', () => {
         const global = createGlobalContext();
         global.declareIdentifier('_options');
         assert.isEmpty(global.getIdentifiers());
      });
      it('Register programs', () => {
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
      it('Register duplicate programs', () => {
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
      it('Register bind/mutable programs', () => {
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
      it('Register literal programs', () => {
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
      it('Register programs and identifiers with forbidden identifiers', () => {
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
      it('Register programs and check keys', () => {
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
      it('Register programs and check by key', () => {
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
      it('Register bind program and check identifiers and programs', () => {
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
      it('Register event program and check identifiers and programs', () => {
         const global = createGlobalContext();
         const eventProgram = parse('a.b.c(d, e.f, g[h])');
         global.registerEventProgram(eventProgram);
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
      it('Declare identifiers', () => {
         const global = createGlobalContext();
         global.declareIdentifier('global_identifier');

         const first = global.createContext();
         first.declareIdentifier('first_identifier');

         const second = first.createContext();
         second.declareIdentifier('second_identifier');

         const identifiers = [
            'global_identifier',
            'first_identifier',
            'second_identifier'
         ];

         assert.deepEqual(global.getIdentifiers(), identifiers.slice(0, 1));
         assert.deepEqual(global.getLocalIdentifiers(), identifiers.slice(0, 1));

         assert.deepEqual(first.getIdentifiers(), identifiers.slice(0, 2));
         assert.deepEqual(first.getLocalIdentifiers(), identifiers.slice(1, 2));

         assert.deepEqual(second.getIdentifiers(), identifiers);
         assert.deepEqual(second.getLocalIdentifiers(), identifiers.slice(2, 3));
      });
      it('Declare duplicate identifiers', () => {
         const global = createGlobalContext();
         global.declareIdentifier('identifier');

         const first = global.createContext();
         first.declareIdentifier('identifier');

         const identifiers = [
            'identifier'
         ];

         assert.deepEqual(global.getIdentifiers(), identifiers);
         assert.deepEqual(global.getLocalIdentifiers(), identifiers);

         assert.deepEqual(first.getIdentifiers(), identifiers);
         assert.deepEqual(first.getLocalIdentifiers(), identifiers);
      });
      it('Register programs', () => {
         const global = createGlobalContext();
         global.registerProgram(parse('global_program'));

         const first = global.createContext();
         first.registerProgram(parse('first_program'));

         const expectedIdentifiers = [
            'global_program',
            'first_program'
         ];
         assert.deepEqual(global.getIdentifiers(), expectedIdentifiers);
         assert.deepEqual(first.getIdentifiers(), expectedIdentifiers);

         assert.deepEqual(global.getLocalIdentifiers(), expectedIdentifiers);
         assert.isEmpty(first.getLocalIdentifiers());
      });
      it('Register duplicate programs', () => {
         const global = createGlobalContext();
         const first = global.createContext();
         const programs = [
            parse('program_1'),
            parse('program_2'),
            parse('program_3')
         ];
         programs.forEach((program: ProgramNode) => {
            first.registerProgram(program);
            global.registerProgram(program);
         });
         assert.deepEqual(global.getPrograms(), programs);
         assert.deepEqual(global.getLocalPrograms(), programs);

         assert.deepEqual(first.getPrograms(), programs);
         assert.isEmpty(first.getLocalPrograms());
      });
      it('Register programs and check keys', () => {
         const global = createGlobalContext();
         global.registerProgram(parse('global_program'));

         const first = global.createContext();
         first.registerProgram(parse('first_program'));

         const programKeys = [
            '_$e0',
            '_$e1'
         ];
         assert.deepEqual(global.getProgramKeys(), programKeys);
         assert.deepEqual(global.getLocalProgramKeys(), programKeys);

         assert.deepEqual(first.getProgramKeys(), programKeys);
         assert.isEmpty(first.getLocalProgramKeys());
      });
      it('Register programs and check by key', () => {
         const global = createGlobalContext();
         const first = global.createContext();
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
            first.registerProgram(program);
            global.registerProgram(program);
         });
         for (let index = 0; index < 3; ++index) {
            const id = identifiers[index];
            const program = programs[index];
            assert.strictEqual(global.getProgram(id), program);
            assert.strictEqual(first.getProgram(id), program);
         }
      });
      it('Register identifiers/programs and check identifiers', () => {
         const global = createGlobalContext();
         global.declareIdentifier('global_declared_identifier');
         global.registerProgram(parse('global_declared_identifier'));
         global.registerProgram(parse('global_identifier'));

         const first = global.createContext();
         first.declareIdentifier('first_declared_identifier');
         first.registerProgram(parse('first_declared_identifier'));
         first.registerProgram(parse('first_identifier'));

         const identifiers = [
            'global_declared_identifier',
            'global_identifier',
            'first_identifier',
            'first_declared_identifier'
         ];

         assert.deepEqual(global.getIdentifiers(), identifiers.slice(0, 3));
         assert.deepEqual(global.getLocalIdentifiers(), identifiers.slice(0, 3));

         assert.deepEqual(first.getIdentifiers(), identifiers);
         assert.deepEqual(first.getLocalIdentifiers(), identifiers.slice(-1));
      });
      it('Register bind program and check identifiers and programs', () => {
         const global = createGlobalContext();
         global.registerBindProgram(parse('global_identifier.field.property.value'));

         const first = global.createContext();
         first.registerBindProgram(parse('first_identifier.field.property.value'));

         const identifiers = [
            'global_identifier',
            'first_identifier'
         ];
         const stringPrograms = [
            'global_identifier.field.property',
            'global_identifier.field.property.value',
            'first_identifier.field.property',
            'first_identifier.field.property.value'
         ];
         assert.deepEqual(global.getIdentifiers(), identifiers);
         assert.deepEqual(
            global.getPrograms().map((program: ProgramNode) => program.string),
            stringPrograms
         );
         assert.deepEqual(
            global.getLocalPrograms().map((program: ProgramNode) => program.string),
            stringPrograms
         );

         assert.deepEqual(first.getIdentifiers(), identifiers);
         assert.deepEqual(
            first.getPrograms().map((program: ProgramNode) => program.string),
            stringPrograms
         );
         assert.isEmpty(
            first.getLocalPrograms().map((program: ProgramNode) => program.string)
         );
      });
      it('Register event program and check identifiers and programs', () => {
         const global = createGlobalContext();
         global.registerEventProgram(parse('a.b.c(d, e.f, g[h])'));

         const first = global.createContext();
         first.registerEventProgram(parse('i.j.k(l, m.n, o[p])'));

         const identifiers = [
            'a',
            'd',
            'e',
            'g',
            'h',
            'i',
            'l',
            'm',
            'o',
            'p'
         ];
         assert.deepEqual(global.getIdentifiers(), identifiers);
         assert.isEmpty(global.getPrograms());
         assert.isEmpty(global.getLocalPrograms());

         assert.deepEqual(first.getIdentifiers(), identifiers);
         assert.isEmpty(first.getPrograms());
         assert.isEmpty(first.getLocalPrograms());
      });
   });
});
