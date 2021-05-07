/**
 * @author Крылов М.А.
 */

import { ProgramNode } from 'Compiler/expressions/Nodes';
import { IProgramMeta, ProgramType, ProgramStorage, createProgramMeta } from './Storage';
import * as Walkers from 'Compiler/expressions/Walkers';
import { Parser } from 'Compiler/expressions/Parser';

const FILE_NAME = '[[Compiler/core/internal/Container]]';

const PARSER = new Parser();

const FORBIDDEN_IDENTIFIERS = [
    '...',
    '_options',
    '_container',
    '_children',
    'rk'
];

function isForbiddenIdentifier(name: string): boolean {
    return FORBIDDEN_IDENTIFIERS.indexOf(name) > -1;
}

export enum ContainerType {
    GLOBAL,
    COMPONENT,
    CONTENT_OPTION,
    TEMPLATE,
    CONDITIONAL,
    CYCLE,
    JOIN
}

export enum InternalNodeType {
    IF,
    ELSE_IF,
    ELSE,
    BLOCK
}

function processInternalMeta(node: InternalNode, storage: Set<string>): void {
    const meta = node.storage.getMeta();
    for (let index = 0; index < meta.length; ++index) {
        const expression = meta[index].node.string;
        if (storage.has(expression)) {
            node.storage.remove(meta[index]);
            continue;
        }
        storage.add(expression);
    }
}

function optimizeInternal(node: InternalNode, storage: Set<string>): void {
    processInternalMeta(node, storage);
    for (let index = 0; index < node.children.length; ++index) {
        const child = node.children[index];
        const childStorage = child.type === InternalNodeType.BLOCK ? storage : new Set<string>(storage);
        optimizeInternal(child, childStorage);
    }
}

function optimize(node: InternalNode): void {
    return optimizeInternal(node, new Set<string>());
}

class IndexAllocator {
    private index: number;

    constructor(index: number) {
        this.index = index;
    }

    allocate(): number {
        return this.index++;
    }
}

interface ICollectorOptions {
    rootIndex: number;
    depth: number;
    allocator: IndexAllocator;
    removeSelfIdentifiers: boolean;
}

export class Container {
    readonly typeName: string;
    desc: string;

    readonly globalContainers: Container[];
    programCounter: number;

    readonly index: number;
    readonly type: ContainerType;
    readonly parent: Container | null;
    readonly children: Container[];

    test: IProgramMeta | null;
    isElse: boolean;
    isInDataType: boolean;
    readonly selfIdentifiers: string[];
    readonly identifiers: string[];
    readonly storage: ProgramStorage;

    readonly codegen: Map<number, string>;
    readonly codegenMap: Map<string, number>;

    constructor(parent: Container | null, type: ContainerType) {
        this.typeName = ContainerType[type];
        this.desc = '';

        this.globalContainers = parent === null ? new Array<Container>() : parent.globalContainers;
        this.codegen = parent === null ? new Map<number, string>() : parent.codegen;
        this.codegenMap = parent === null ? new Map<string, number>() : parent.codegenMap;
        this.programCounter = 0;

        this.type = type;
        this.index = this.globalContainers.length;
        this.parent = parent;
        this.children = [];

        this.test = null;
        this.isElse = false;
        this.isInDataType = false;
        this.selfIdentifiers = [];
        this.identifiers = [];
        this.storage = new ProgramStorage();

        this.globalContainers.push(this);
        if (this.parent !== null) {
            this.parent.children.push(this);
        }
    }

    createContainer(type: ContainerType): Container {
        return new Container(this, type);
    }

    addIdentifier(identifier: string): void {
        if (this.selfIdentifiers.indexOf(identifier) === -1) {
            this.selfIdentifiers.push(identifier);
        }
        if (this.identifiers.indexOf(identifier) === -1) {
            this.identifiers.push(identifier);
        }
    }

    registerTestProgram(program: ProgramNode): void {
        // TODO: There can be truthy/falsy literal. Release optimization
        this.processIdentifiers(program);
        this.test = createProgramMeta(
            'data',
            ProgramType.SIMPLE,
            program,
            this.allocateProgramIndex(),
            false,
            this.index,
            this.getProcessingContainerIndex()
        );
    }

    registerProgram(program: ProgramNode, type: ProgramType, name: string | null): void {
        switch (type) {
            case ProgramType.SIMPLE:
            case ProgramType.ATTRIBUTE:
            case ProgramType.OPTION:
                return this.applyProgram(program, type, name, false);
            case ProgramType.BIND:
                return this.registerBindProgram(program, type, name);
            case ProgramType.EVENT:
                return this.registerEventProgram(program);
            case ProgramType.FLOAT:
                return this.registerFloatProgram(program);
            default:
                throw new Error('Получен неизвестный тип Mustache-выражения');
        }
    }

    getOwnIdentifiers(): string[] {
        // @ts-ignore FIXME: tslib cannot be found
        return Array(...this.identifiers);
    }

    joinContainer(container: Container, identifiers: string[]): void {
        const join = new Container(this, ContainerType.JOIN);
        join.desc = `JOIN @${container.index}`;
        for (let index = 0; index < identifiers.length; ++index) {
            join.addIdentifier(identifiers[index]);
        }
        join.children.push(container);
    }

    getInternalStructure(removeSelfIdentifiers: boolean = false): InternalNode {
        const allocator = new IndexAllocator(this.getCurrentProgramIndex());
        const options: ICollectorOptions = {
            rootIndex: this.index,
            depth: 0,
            allocator,
            removeSelfIdentifiers
        };
        const node = this.collectInternalStructure(options);
        optimize(node);
        return node;
    }

    commitCode(index: number, code: string): void {
        this.codegen.set(index, code);
        this.codegenMap.set(code, index);
    }

    getCommittedIndex(code: string): number | null {
        if (this.codegenMap.has(code)) {
            return this.codegenMap.get(code);
        }
        return null;
    }

    getProcessingContainerIndex(): number {
        // Здесь перечислены типы контейнеров, для которых выполняется вычисление контекста
        // Заметка: для типа CYCLE тоже выполняется вычисление контекста (добавляются index, item переменные),
        //    но для типа CYCLE выполняется контроль этих переменных - сами переменные и выражения с этими переменными
        //    не всплывают в родительские контейнеры.
        if (
            this.type === ContainerType.GLOBAL ||
            this.type === ContainerType.TEMPLATE ||
            this.type === ContainerType.CONTENT_OPTION ||
            this.parent === null
        ) {
            return this.index;
        }
        return this.parent.getProcessingContainerIndex();
    }

    private collectInternalStructure(options: ICollectorOptions): InternalNode {
        const node = this.createInternalNode(options);
        let prevChild: InternalNode | null = null;
        const childrenOptions: ICollectorOptions = {
            rootIndex: options.rootIndex,
            allocator: options.allocator,
            removeSelfIdentifiers: options.removeSelfIdentifiers,
            depth: options.depth + 1
        };
        for (let index = 0; index < this.children.length; ++index) {
            const canSkipChild = options.depth === 0
                && this.children[index].type === ContainerType.CONTENT_OPTION
                && !this.children[index].isInDataType;
            if (canSkipChild) {
                continue;
            }
            const child = this.children[index].collectInternalStructure(childrenOptions);
            node.children.push(child);
            child.prev = prevChild;
            if (prevChild !== null) {
                prevChild.next = child;
            }
            prevChild = child;
            child.setParent(node);
        }
        if (!options.removeSelfIdentifiers && options.depth === 0 && this.type === ContainerType.CONTENT_OPTION) {
            return node;
        }
        if (this.selfIdentifiers.length > 0) {
            node.removeIfContains(this.selfIdentifiers, options);
        }
        return node;
    }

    private createInternalNode(options: ICollectorOptions): InternalNode {
        const node = new InternalNode(this.index, this.getInternalNodeType(), this);
        node.test = this.test;
        node.isInDataType = this.isInDataType;
        let selfPrograms = this.storage.getMeta();
        const filterPrograms = options.depth === 0 && this.type === ContainerType.COMPONENT;
        if (filterPrograms) {
            selfPrograms = selfPrograms.filter((meta: IProgramMeta) => {
                if (meta.type === ProgramType.ATTRIBUTE) {
                    // Атрибуты попадают в коллекцию атрибутов, в internal их не записываем.
                    return false;
                }
                if (meta.type === ProgramType.OPTION) {
                    // Все опции попадают в коллекцию опций, в internal их не записываем.
                    // Исключение - опция scope, она не попадает в опции, но ее изменение нужно отследить
                    return meta.name === 'scope';
                }
                if (meta.type === ProgramType.BIND) {
                    // Все значения bind выражений попадают в опции, в internal их не записываем.
                    // Исключение - контекст bind-выражения (все синтетические выражения).
                    // FIXME: DEV: REMOVE
                    // return meta.isSynthetic;
                }
                return true;
            });
        }
        for (let index = 0; index < selfPrograms.length; ++index) {
            node.storage.set(selfPrograms[index]);
        }
        return node;
    }

    private getInternalNodeType(): InternalNodeType {
        if (this.type === ContainerType.CONDITIONAL) {
            if (this.isElse) {
                if (this.test === null) {
                    return InternalNodeType.ELSE;
                }
                return InternalNodeType.ELSE_IF;
            }
            return InternalNodeType.IF;
        }
        return InternalNodeType.BLOCK;
    }

    private applyProgram(program: ProgramNode, type: ProgramType, name: string | null, isSynthetic: boolean): void {
        if (Walkers.hasDecorators(program, FILE_NAME)) {
            return;
        }
        if (!this.processIdentifiers(program)) {
            return;
        }
        const meta = createProgramMeta(
            name,
            type,
            program,
            this.allocateProgramIndex(),
            isSynthetic,
            this.index,
            this.getProcessingContainerIndex()
        );
        this.commitProgram(meta);
    }

    private registerBindProgram(program: ProgramNode, type: ProgramType, name: string | null): void {
        const programs = Walkers.dropBindProgram(program, PARSER, FILE_NAME);
        for (let index = 0; index < programs.length; ++index) {
            const isSynthetic = index + 1 < programs.length;
            this.applyProgram(programs[index], type, name, isSynthetic);
        }
    }

    private registerEventProgram(program: ProgramNode): void {
        this.processIdentifiers(program);
    }

    private registerFloatProgram(program: ProgramNode): void {
        const identifiers = Walkers.collectIdentifiers(program, FILE_NAME);
        this.commitIdentifiersAsPrograms(identifiers, this.identifiers, ProgramType.FLOAT);
        for (let index = 0; index < identifiers.length; ++index) {
            const identifier = identifiers[index];
            this.hoistIdentifier(identifier);
            this.commitIdentifier(identifier);
            this.commitSelfIdentifier(identifier);
        }
    }

    private allocateProgramIndex(): number {
        if (this.parent === null) {
            return this.programCounter++;
        }
        return this.parent.allocateProgramIndex();
    }

    private getCurrentProgramIndex(): number {
        if (this.parent === null) {
            return this.programCounter;
        }
        return this.parent.getCurrentProgramIndex();
    }

    private processIdentifiers(program: ProgramNode): boolean {
        const identifiers = Walkers.collectIdentifiers(program, FILE_NAME);
        // Do not register program without identifiers.
        if (identifiers.length === 0) {
            return false;
        }
        for (let index = 0; index < identifiers.length; ++index) {
            const identifier = identifiers[index];
            this.hoistIdentifier(identifier);
        }
        return true;
    }

    private hoistIdentifier(identifier: string): void {
        if (this.identifiers.indexOf(identifier) > -1 || isForbiddenIdentifier(identifier)) {
            return;
        }
        if (this.isIdentifierHoistingAllowed()) {
            this.parent.hoistIdentifier(identifier);
            return;
        }
        this.commitIdentifier(identifier);
        this.hoistReactiveIdentifier(identifier);
    }

    private isIdentifierHoistingAllowed(): boolean {
        return this.parent !== null && this.type !== ContainerType.TEMPLATE;
    }

    private commitIdentifier(identifier: string): void {
        if (this.identifiers.indexOf(identifier) > -1) {
            return;
        }
        this.identifiers.push(identifier);
    }

    private commitSelfIdentifier(identifier: string): void {
        if (this.selfIdentifiers.indexOf(identifier) > -1) {
            return;
        }
        this.selfIdentifiers.push(identifier);
    }

    private hoistReactiveIdentifier(identifier: string): void {
        if (this.parent === null) {
            this.commitIdentifier(identifier);
            return;
        }
        this.parent.hoistReactiveIdentifier(identifier);
    }

    private commitProgram(meta: IProgramMeta): void {
        this.storage.set(meta);
    }

    private commitIdentifiersAsPrograms(identifiers: string[], localIdentifiers: string[], type: ProgramType): void {
        for (let index = 0; index < identifiers.length; ++index) {
            const identifier = identifiers[index];
            if (this.identifiers.indexOf(identifier) > -1) {
                continue;
            }
            if (localIdentifiers.indexOf(identifier) > -1) {
                continue;
            }
            const program = PARSER.parse(identifier);
            const meta = createProgramMeta(
                null,
                type,
                program,
                this.allocateProgramIndex(),
                true,
                this.index,
                this.getProcessingContainerIndex()
            );
            this.commitProgram(meta);
        }
    }
}

export class InternalNode {
    readonly index: number;

    isInDataType: boolean;
    type: InternalNodeType;
    typeName: string;

    parent: InternalNode;
    prev: InternalNode | null;
    next: InternalNode | null;
    children: InternalNode[];

    test: IProgramMeta | null;
    storage: ProgramStorage;

    ref: Container;

    constructor(index: number, type: InternalNodeType, ref: Container) {
        this.index = index;
        this.type = type;
        this.typeName = InternalNodeType[type];

        this.parent = null;
        this.prev = null;
        this.next = null;
        this.children = [];

        this.test = null;
        this.storage = new ProgramStorage();
        this.ref = ref;
    }

    setParent(parent: InternalNode): void {
        this.parent = parent;
    }

    removeIfContains(identifiers: string[], options: ICollectorOptions): void {
        this.checkCleanConditional(identifiers, options);
        this.cleanStorage(identifiers, options);
        for (let index = 0; index < this.children.length; ++index) {
            this.children[index].removeIfContains(identifiers, options);
        }
    }

    setType(type: InternalNodeType): void {
        this.type = type;
        this.typeName = InternalNodeType[type];
    }

    private cleanStorage(identifiers: string[], options: ICollectorOptions): void {
        const collection = this.storage.getMeta();
        for (let index = 0; index < collection.length; ++index) {
            const meta = collection[index];
            if (meta.type === ProgramType.FLOAT && meta.isSynthetic) {
                continue;
            }
            if (Walkers.containsIdentifiers(meta.node, identifiers, FILE_NAME)) {
                this.storage.remove(meta);

                const localIdentifiers = Walkers.collectIdentifiers(meta.node, FILE_NAME);
                for (let idIndex = 0; idIndex < localIdentifiers.length; ++idIndex) {
                    const identifier = localIdentifiers[idIndex];
                    if (identifiers.indexOf(identifier) > -1) {
                        continue;
                    }
                    const program = PARSER.parse(identifier);
                    const idMeta = createProgramMeta(
                        null,
                        ProgramType.SIMPLE,
                        program,
                        options.allocator.allocate(),
                        true,
                        this.ref.index,
                        this.ref.getProcessingContainerIndex()
                    );
                    this.storage.set(idMeta);
                }
            }
        }
    }

    private checkCleanConditional(identifiers: string[], options: ICollectorOptions): void {
        if (this.type === InternalNodeType.BLOCK || this.type === InternalNodeType.ELSE) {
            return;
        }
        const hasFunctionCall = Walkers.containsFunctionCall(this.test.node, FILE_NAME);
        const hasLocalIdentifier = Walkers.containsIdentifiers(this.test.node, identifiers, FILE_NAME);
        const isForeignTest = this.test.processingIndex !== options.rootIndex;
        if (hasLocalIdentifier) {
            this.dropAndAppend(identifiers, options.allocator);
        } else if (hasFunctionCall || isForeignTest) {
            this.storage.set(this.test);
        } else {
            // Do not modify conditional node
            return;
        }
        this.setType(
            this.type === InternalNodeType.ELSE_IF
                ? InternalNodeType.ELSE
                : InternalNodeType.BLOCK
        );
        this.test = null;
        if (this.next === null) {
            return;
        }
        if (this.next.type === InternalNodeType.ELSE_IF) {
            this.next.setType(InternalNodeType.IF);
        } else if (this.next.type === InternalNodeType.ELSE) {
            this.next.setType(InternalNodeType.BLOCK);
        }
    }

    private dropAndAppend(identifiers: string[], allocator: IndexAllocator): void {
        if (this.test === null) {
            return;
        }
        const testIdentifiers = Walkers.collectIdentifiers(this.test.node, FILE_NAME);
        for (let idIndex = 0; idIndex < testIdentifiers.length; ++idIndex) {
            const identifier = testIdentifiers[idIndex];
            if (identifiers.indexOf(identifier) > -1) {
                continue;
            }
            const program = PARSER.parse(identifier);
            const idMeta = createProgramMeta(
                null,
                ProgramType.SIMPLE,
                program,
                allocator.allocate(),
                true,
                this.ref.index,
                this.ref.getProcessingContainerIndex()
            );
            this.storage.set(idMeta);
        }
    }

    flatten(): IProgramMeta[] {
        return this.collectMeta(new Set<string>(), []);
    }

    private collectMeta(names: Set<string>, collection: IProgramMeta[]): IProgramMeta[] {
        for (let index = 0; index < this.children.length; ++index) {
            this.children[index].collectMeta(names, collection);
        }

        const localCollection = this.storage.getMeta();
        if (this.test) {
            localCollection.push(this.test);
        }
        for (let index = 0; index < localCollection.length; ++index) {
            if (names.has(localCollection[index].node.string)) {
                continue;
            }
            names.add(localCollection[index].node.string);
            collection.push(localCollection[index]);
        }

        return collection;
    }
}
