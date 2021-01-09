import { Parser } from 'UI/_builder/Tmpl/expressions/_private/Parser';
import { ProgramNode } from 'UI/_builder/Tmpl/expressions/_private/Nodes';
import * as Helpers from 'UI/_builder/Tmpl/expressions/_private/Helpers';
import { assert } from 'chai';

// TODO: UI/_builder/Tmpl/* -> Compiler/*

const FILE_NAME = 'Helpers.test';

function parse(source: string): ProgramNode {
   return new Parser().parse(source);
}

describe('Compiler/expressions/_private/Helpers', () => {
   describe('hasBindings()', () => {
      it('Has bind', () => {
         assert.isTrue(Helpers.hasBindings(parse('"value" | bind')));
      });
      it('Has no bind', () => {
         assert.isFalse(Helpers.hasBindings(parse('condition')));
      });
   });
   describe('containsIdentifiers()', () => {
      it('Has no identifiers 1', () => {
         const identifiers = [];
         assert.isFalse(Helpers.containsIdentifiers(parse('[true, 1, "string"]'), identifiers, FILE_NAME));
      });
      it('Has no identifiers 2', () => {
         const identifiers = ['fi', 'index'];
         assert.isFalse(Helpers.containsIdentifiers(parse('f(i, id, idx)'), identifiers, FILE_NAME));
      });
      it('Has identifiers', () => {
         const identifiers = ['id'];
         assert.isTrue(Helpers.containsIdentifiers(parse('f(i, id, idx)'), identifiers, FILE_NAME));
      });
   });
   describe('collectIdentifiers()', () => {
      it('Literals', () => {
         const actual = Helpers.collectIdentifiers(parse('[true, 1, "string"]'), FILE_NAME);
         const expected = [];
         assert.deepEqual(actual, expected);
      });
      it('Identifiers', () => {
         const actual = Helpers.collectIdentifiers(parse('a[b].c(d, e ? f : g) + h([i, j], { "k": m })'), FILE_NAME).sort();
         const expected = ['a', 'b', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'm'];
         assert.deepEqual(actual, expected);
      });
   });
   describe('dropBindProgram()', () => {
      it('Simple', () => {
         const actual = Helpers.dropBindProgram(parse('a'), new Parser(), FILE_NAME)
            .map((p: ProgramNode): string => p.string);
         const expected = ['a'];
         assert.deepEqual(actual, expected);
      });
      it('Long', () => {
         const actual = Helpers.dropBindProgram(parse('a.b.c.d.e'), new Parser(), FILE_NAME)
            .map((p: ProgramNode): string => p.string);
         const expected = ['a.b.c.d', 'a.b.c.d.e'];
         assert.deepEqual(actual, expected);
      });
   });
});
