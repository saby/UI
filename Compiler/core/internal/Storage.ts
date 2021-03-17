/**
 * @author Крылов М.А.
 */

import { ProgramNode } from 'Compiler/expressions/Nodes';

export interface IProgramMeta {

    // Имя атрибута, в значении которого содержится Mustache-выражение
    name: string | null;

    // Тип Mustache-выражения
    typeName: string;

    // Тип Mustache-выражения
    type: ProgramType;

    // Mustache-выражение
    node: ProgramNode;

    // Уникальный идентификатор Mustache-выражения
    index: number;

    // Флаг синтетического Mustache-выражения, которое было получено путем дробления bind-выражения
    // или выражения, в котором присутствуют невычислимые переменные
    isSynthetic: boolean;

    // Индекс контейнера, в котором произошла регистрация Mustache-выражения
    originIndex: number;

    // Индекс контейнера, от контекста которого будет выполнено вычисление Mustache-выражения
    processingIndex: number;
}

export function createProgramMeta(
    name: string | null,
    type: ProgramType,
    node: ProgramNode,
    index: number,
    isSynthetic: boolean,
    originIndex: number,
    processingIndex: number
): IProgramMeta {
    return {
        typeName: ProgramType[type],
        index,
        name,
        node,
        isSynthetic,
        type,
        originIndex,
        processingIndex
    };
}

export enum ProgramType {
    SIMPLE,
    ATTRIBUTE,
    BIND,
    OPTION,
    EVENT,
    FLOAT
}

export class ProgramStorage {
    private readonly programs: IProgramMeta[];
    private readonly programsMap: Map<string, number>;

    constructor() {
        this.programs = [];
        this.programsMap = new Map<string, number>();
    }

    findIndex(program: ProgramNode): number | null {
        const source = program.string;
        if (this.programsMap.has(source)) {
            const index = this.programsMap.get(source);
            return this.programs[index].index;
        }
        return null;
    }

    get(program: ProgramNode): IProgramMeta | null {
        const source = program.string;
        if (!this.programsMap.has(source))  {
            return null;
        }
        const index = this.programsMap.get(source);
        return this.programs[index];
    }

    set(meta: IProgramMeta): void {
        const source = meta.node.string;
        // Do not append program that already exists
        if (this.programsMap.has(source)) {
            return;
        }
        // Description index in collection that will be set
        const index: number = this.programs.length;
        this.programsMap.set(source, index);
        this.programs.push(meta);
    }

    remove(meta: IProgramMeta): void {
        const source = meta.node.string;
        if (!this.programsMap.has(source))  {
            return;
        }
        const index = this.programsMap.get(source);
        this.programs.splice(index, 1);
        this.programsMap.forEach((value: number, key: string) => {
            if (value >= index) {
                this.programsMap.set(key, value - 1);
            }
        });
        this.programsMap.delete(source);
    }

    getMeta(): IProgramMeta[] {
        return Array(...this.programs);
    }
}