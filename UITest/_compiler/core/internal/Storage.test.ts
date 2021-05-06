import { createProgramMeta, IProgramMeta, ProgramStorage, ProgramType } from 'Compiler/core/internal/Storage';
import { Parser } from 'Compiler/expressions/Parser';
import { assert } from 'chai';
import { ProgramNode } from 'Compiler/expressions/Nodes';

function parse(text: string): ProgramNode {
    return new Parser().parse(text);
}

function parseAndCreate(text: string, index: number): IProgramMeta {
    return createProgramMeta(null, ProgramType.SIMPLE, parse(text), index, false, 0, 0);
}

const PROGRAMS = [
    'a+b',
    'c/d',
    'e?f():g+i',
    'j-(k+m)'
];

describe('Compiler/core/internal/Storage', () => {
    let storage: ProgramStorage;

    beforeEach(() => {
        storage = new ProgramStorage();
        PROGRAMS.forEach(
            (text, index) => storage.set(parseAndCreate(text, index))
        );
    });

    afterEach(() => {
        storage = null;
    });

    it('storage holds programs correctly', () => {
        PROGRAMS.forEach(
            (text, index) => {
                const meta = storage.get(parse(text));
                assert.strictEqual(meta.index, index);
                assert.strictEqual(meta.node.string, text);
            }
        );
    });

    it('find index of meta by program node', () => {
        PROGRAMS.forEach(
            (text, index) => {
                const foundIndex = storage.findIndex(parse(text));
                assert.strictEqual(foundIndex, index);
            }
        );
    });

    it('remove meta at the beginning', () => {
        const meta = storage.get(parse(PROGRAMS[0]));
        storage.remove(meta);
        PROGRAMS.forEach(
            (text, index) => {
                const currentMeta = storage.get(parse(text));
                if (currentMeta === null && meta.index === index) {
                    // it is removed meta object
                    return;
                }
                assert.strictEqual(currentMeta.index, index);
            }
        );
    });

    it('remove meta in the middle', () => {
        const removeIndex = Math.trunc(PROGRAMS.length / 2);
        const meta = storage.get(parse(PROGRAMS[removeIndex]));
        storage.remove(meta);
        PROGRAMS.forEach(
            (text, index) => {
                const currentMeta = storage.get(parse(text));
                if (currentMeta === null && meta.index === index) {
                    // it is removed meta object
                    return;
                }
                assert.strictEqual(currentMeta.index, index);
            }
        );
    });

    it('remove meta in the end', () => {
        const meta = storage.get(parse(PROGRAMS[PROGRAMS.length - 1]));
        storage.remove(meta);
        PROGRAMS.forEach(
            (text, index) => {
                const currentMeta = storage.get(parse(text));
                if (currentMeta === null && meta.index === index) {
                    // it is removed meta object
                    return;
                }
                assert.strictEqual(currentMeta.index, index);
            }
        );
    });
});
