import { createProcessingContext } from 'UI/_builder/Tmpl/core/Context';
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
         const global = createProcessingContext();
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
         const global = createProcessingContext();
         global.declareIdentifier('ident');
         try {
            global.declareIdentifier('ident');
         } catch (error) {
            assert.strictEqual(error.message, 'Переменная "ident" уже определена');
            return;
         }
         throw new Error('Must be failed');
      });
      it('.registerProgram()', () => {
         const global = createProcessingContext();
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
         const global = createProcessingContext();
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
         const global = createProcessingContext();
         const programs = [
            parse('"value1"|bind'),
            parse('"value2"|mutable')
         ];
         programs.forEach((program: ProgramNode) => {
            global.registerProgram(program);
         });
         assert.isEmpty(global.getPrograms());
      });
      it('.getProgramIdentifiers()', () => {
         const global = createProcessingContext();
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
         assert.deepEqual(global.getProgramIdentifiers(), identifiers);
      });
      it('.getProgram()', () => {
         const global = createProcessingContext();
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
   });
});
