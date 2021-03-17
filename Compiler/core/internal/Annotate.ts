import * as Ast from 'Compiler/core/Ast';
import Scope from 'Compiler/core/Scope';
import { Container, ContainerType } from 'Compiler/core/internal/Container';
import { IProgramMeta, ProgramType } from './Storage';
import { ProgramNode } from 'Compiler/expressions/Nodes';
import * as Walkers from 'Compiler/expressions/Walkers';

const INTERNAL_PROGRAM_PREFIX = '__dirtyCheckingVars_';
const FILE_NAME = '[[Compiler/core/internal/Annotate]]';

export interface IResultTree extends Array<Ast.Ast> {

    /**
     * Child names collection.
     */
    childrenStorage: string[];

    /**
     * Reactive property names collection.
     */
    reactiveProps: string[];

    /**
     * Inline template names collection.
     */
    templateNames: string[];

    /**
     * Global lexical context.
     */
    container: Container;

    /**
     * Abstract syntax tree contains translations.
     */
    hasTranslations: boolean;

    /**
     * Special flag.
     * @deprecated
     */
    __newVersion: boolean;
}

enum AbstractNodeType {
    ROOT,
    COMPONENT,
    COMPONENT_OPTION,
    ELEMENT,
    DATA_TYPE_DIRECTIVE,
    DIRECTIVE,
    ATTRIBUTE,
    OPTION,
    TEXT
}

class Counters {
    private cycle: number;

    constructor() {
        this.cycle = 0;
    }

    allocateCycleIndex(): number {
        return this.cycle++;
    }
}

interface IContext {
    attributeName?: string;
    childrenStorage: string[];
    container: Container;
    scope: Scope;
    counters: Counters;
}

function wrapInternalExpressions(programs: IProgramMeta[]): any {
    const internal = { };
    for (let index = 0; index < programs.length; ++index) {
        const program = programs[index];
        internal[INTERNAL_PROGRAM_PREFIX + index] = {
            data: [
                new Ast.ExpressionNode(program.node)
            ],
            type: 'text'
        };
    }
    return internal;
}

declare type IProperties = Ast.IAttributes | Ast.IEvents | Ast.IOptions | Ast.IContents | Ast.IObjectProperties;

function visitAll(nodes: Ast.Ast[], visitor: Ast.IAstVisitor, context: IContext): void {
    for (let index = 0; index < nodes.length; ++index) {
        nodes[index].accept(visitor, context);
    }
}

function visitAllProperties(properties: IProperties, visitor: Ast.IAstVisitor, context: IContext): void {
    for (const name in properties) {
        properties[name].accept(visitor, context);
    }
}

function collectInlineTemplateIdentifiers(node: Ast.InlineTemplateNode): string[] {
    const identifiers = [];
    for (const name in node.__$ws_events) {
        const event = node.__$ws_events[name];
        if (event instanceof Ast.BindNode) {
            // bind:option="option" is simple alias and deep usages exist in current scope
            if (event.__$ws_property !== event.__$ws_value.string) {
                identifiers.push(event.__$ws_property);
            }
        }
    }
    for (const name in node.__$ws_options) {
        const option = node.__$ws_options[name];
        if (option.hasFlag(Ast.Flags.TYPE_CASTED | Ast.Flags.UNPACKED) && option.__$ws_value instanceof Ast.ValueNode) {
            const value = option.__$ws_value;
            const valuePart = value.__$ws_data[0];
            if (value.__$ws_data.length === 1 && valuePart instanceof Ast.ExpressionNode) {
                if (option.__$ws_name === valuePart.__$ws_program.string) {
                    // Skip only case option="{{ option }}"
                    continue;
                }
            }
        }
        identifiers.push(option.__$ws_name);
    }
    return identifiers;
}

function getProgramType(stack: AbstractNodeType[]): ProgramType {
    let isInComponent = false;
    let isInAttribute = false;
    let isInOption = false;
    for (let index = stack.length - 1; index > -1; --index) {
        if (stack[index] === AbstractNodeType.DATA_TYPE_DIRECTIVE) {
            continue;
        } else if (stack[index] === AbstractNodeType.COMPONENT) {
            isInComponent = true;
        } else if (stack[index] === AbstractNodeType.ATTRIBUTE) {
            isInAttribute = true;
            continue;
        } else if (stack[index] === AbstractNodeType.OPTION) {
            isInOption = true;
            continue;
        }
        break;
    }
    if (isInComponent) {
        if (isInAttribute) {
            return ProgramType.ATTRIBUTE;
        } else if (isInOption) {
            return ProgramType.OPTION;
        }
    }
    return ProgramType.SIMPLE;
}

function isInComponentAttributes(stack: AbstractNodeType[]): boolean {
    for (let index = stack.length - 1; index > -1; --index) {
        if (stack[index] === AbstractNodeType.DATA_TYPE_DIRECTIVE) {
            continue;
        }
        if (stack[index] === AbstractNodeType.COMPONENT) {
            return true;
        }
        break;
    }
    return false;
}

function isInDataTypeDirective(stack: AbstractNodeType[]): boolean {
    for (let index = stack.length - 1; index > -1; --index) {
        if (stack[index] === AbstractNodeType.DATA_TYPE_DIRECTIVE) {
            return true;
        }
        if (
            stack[index] === AbstractNodeType.COMPONENT ||
            stack[index] === AbstractNodeType.COMPONENT_OPTION ||
            stack[index] === AbstractNodeType.ELEMENT ||
            stack[index] === AbstractNodeType.DIRECTIVE ||
            stack[index] === AbstractNodeType.ATTRIBUTE ||
            stack[index] === AbstractNodeType.OPTION ||
            stack[index] === AbstractNodeType.TEXT
        ) {
            return false;
        }
    }
    return false;
}

/**
 * Get string value from text.
 * @param value {TText[]} Collection of text nodes.
 * @return {string | null} Returns string in case of collection has single text node.
 */
function getStringValueFromText(value: Ast.TText[]): string | null {
    if (value.length !== 1) {
        return null;
    }
    const valueNode = value[0];
    if (!(valueNode instanceof Ast.TextDataNode)) {
        return null;
    }
    return valueNode.__$ws_content;
}

/**
 * Get element name.
 * @param element {BaseHtmlElement} Element node.
 * @return {string | null} Returns element name if it exists.
 */
function getElementName(element: Ast.BaseHtmlElement): string | null {
    if (element.__$ws_attributes.hasOwnProperty('attr:name')) {
        return getStringValueFromText(element.__$ws_attributes['attr:name'].__$ws_value);
    }
    if (element.__$ws_attributes.hasOwnProperty('name')) {
        return getStringValueFromText(element.__$ws_attributes.name.__$ws_value);
    }
    return null;
}

/**
 * Get string value from string or value node.
 * @param value {TData} Data node.
 * @return {string | null} Returns string value for string or value node.
 */
function getStringValueFromData(value: Ast.TData): string | null {
    if (value instanceof Ast.ValueNode) {
        return getStringValueFromText(value.__$ws_data);
    }
    if (value instanceof Ast.StringNode) {
        return getStringValueFromText(value.__$ws_data);
    }
    return null;
}

/**
 * Get component name.
 * @param component {BaseWasabyElement} Component node.
 * @return {string | null} Returns component name if it exists.
 */
function getComponentName(component: Ast.BaseWasabyElement): string | null {
    const elementName = getElementName(component);
    if (elementName !== null) {
        return elementName;
    }
    if (component.__$ws_options.hasOwnProperty('attr:name')) {
        return getStringValueFromData(component.__$ws_options['attr:name'].__$ws_value);
    }
    if (component.__$ws_options.hasOwnProperty('name')) {
        return getStringValueFromData(component.__$ws_options.name.__$ws_value);
    }
    return null;
}

/**
 * Set root node flag.
 * @param nodes {Ast[]} Collection of nodes of abstract syntax tree.
 */
function setRootNodeFlags(nodes: Ast.Ast[]): void {
    nodes.forEach((node) => {
        if (node instanceof Ast.IfNode) {
            setRootNodeFlags(node.__$ws_consequent);
            return;
        }
        if (node instanceof Ast.ElseNode) {
            setRootNodeFlags(node.__$ws_consequent);
            return;
        }
        if (node instanceof Ast.ForNode) {
            setRootNodeFlags(node.__$ws_content);
            return;
        }
        if (node instanceof Ast.ForeachNode) {
            setRootNodeFlags(node.__$ws_content);
            return;
        }
        node.__$ws_isRootNode = true;
    });
}

function checkForTranslations(scope: Scope, program: ProgramNode | null): void {
    if (!program) {
        return;
    }
    if (Walkers.containsTranslationFunction(program, FILE_NAME)) {
        scope.setDetectedTranslation();
    }
}

export class InternalVisitor implements Ast.IAstVisitor {
    readonly stack: AbstractNodeType[];

    constructor() {
        this.stack = [];
    }

    process(nodes: Ast.Ast[], scope: Scope): IResultTree {
        const container = new Container(null, ContainerType.GLOBAL);
        const childrenStorage: string[] = [];
        const context: IContext = {
            childrenStorage,
            container,
            scope,
            counters: new Counters()
        };
        this.stack.push(AbstractNodeType.ROOT);
        for (let index = 0; index < nodes.length; ++index) {
            nodes[index].accept(this, context);
            if (!nodes[index].__$ws_container) {
                nodes[index].__$ws_container = container;
            }
            if (!nodes[index].__$ws_internalTree) {
                nodes[index].__$ws_internalTree = nodes[index].__$ws_container.getInternalStructure();
                nodes[index].__$ws_internal = wrapInternalExpressions(nodes[index].__$ws_internalTree.flatten());
            }
        }
        this.stack.pop();
        const result = nodes as IResultTree;
        result.childrenStorage = childrenStorage;
        result.reactiveProps = container.getOwnIdentifiers();
        result.templateNames = scope.getTemplateNames();
        result.container = container;
        result.hasTranslations = scope.hasDetectedTranslations();
        result.__newVersion = true;
        return result;
    }

    visitAttribute(node: Ast.AttributeNode, context: IContext): void {
        const childContext: IContext = {
            childrenStorage: context.childrenStorage,
            container: context.container,
            scope: context.scope,
            attributeName: node.__$ws_name,
            counters: context.counters
        };
        this.stack.push(AbstractNodeType.ATTRIBUTE);
        visitAll(node.__$ws_value, this, childContext);
        this.stack.pop();
    }

    visitOption(node: Ast.OptionNode, context: IContext): void {
        const childContext: IContext = {
            childrenStorage: context.childrenStorage,
            container: context.container,
            scope: context.scope,
            attributeName: node.__$ws_name,
            counters: context.counters
        };
        this.stack.push(AbstractNodeType.OPTION);
        node.__$ws_value.accept(this, childContext);
        this.stack.pop();
    }

    visitContentOption(node: Ast.ContentOptionNode, context: IContext): void {
        const container = context.container.createContainer(ContainerType.CONTENT_OPTION);
        container.addIdentifier(node.__$ws_name);
        container.desc = node.__$ws_name;
        container.isInDataType = isInDataTypeDirective(this.stack);
        const childContext: IContext = {
            childrenStorage: context.childrenStorage,
            container,
            scope: context.scope,
            counters: context.counters
        };
        this.stack.push(AbstractNodeType.COMPONENT_OPTION);
        visitAll(node.__$ws_content, this, childContext);
        setRootNodeFlags(node.__$ws_content);
        this.stack.pop();

        node.__$ws_container = container;
        node.__$ws_internalTree = container.getInternalStructure();
        node.__$ws_internal = wrapInternalExpressions(node.__$ws_internalTree.flatten());
    }

    visitBind(node: Ast.BindNode, context: IContext): void {
        const isInComponent = isInComponentAttributes(this.stack);
        const programName = isInComponent ? node.__$ws_property : null;
        context.container.registerProgram(node.__$ws_value, ProgramType.BIND, programName);
        checkForTranslations(context.scope, node.__$ws_value);
    }

    visitEvent(node: Ast.EventNode, context: IContext): void {
        const isInComponent = isInComponentAttributes(this.stack);
        const programName = isInComponent ? node.__$ws_event : null;
        context.container.registerProgram(node.__$ws_handler, ProgramType.EVENT, programName);
        checkForTranslations(context.scope, node.__$ws_handler);
    }

    visitElement(node: Ast.ElementNode, context: IContext): void {
        const name = getElementName(node);
        if (name !== null) {
            context.childrenStorage.push(name);
        }
        this.stack.push(AbstractNodeType.ELEMENT);
        visitAll(node.__$ws_content, this, context);
        visitAllProperties(node.__$ws_attributes, this, context);
        visitAllProperties(node.__$ws_events, this, context);
        this.stack.pop();
    }

    visitDoctype(node: Ast.DoctypeNode, context: IContext): void { }

    visitCData(node: Ast.CDataNode, context: IContext): void { }

    visitInstruction(node: Ast.InstructionNode, context: IContext): void { }

    visitComment(node: Ast.CommentNode, context: IContext): void { }

    visitComponent(node: Ast.ComponentNode, context: IContext): void {
        const childContainer = this.processComponent(node, context);
        childContainer.desc = `<${node.__$ws_path.getFullPath()}>`;
        node.__$ws_internalTree = childContainer.getInternalStructure();
        node.__$ws_internal = wrapInternalExpressions(node.__$ws_internalTree.flatten());
    }

    visitInlineTemplate(node: Ast.InlineTemplateNode, context: IContext): void {
        const childContainer = this.processComponent(node, context);
        const template = context.scope.getTemplate(node.__$ws_name);
        const identifiers = collectInlineTemplateIdentifiers(node);
        childContainer.joinContainer(template.__$ws_container, identifiers);
        childContainer.desc = `<ws:partial> @@ inline "${node.__$ws_name}"`;
        node.__$ws_internalTree = childContainer.getInternalStructure();
        node.__$ws_internal = wrapInternalExpressions(node.__$ws_internalTree.flatten());
    }

    visitStaticPartial(node: Ast.StaticPartialNode, context: IContext): void {
        const childContainer = this.processComponent(node, context);
        childContainer.desc = `<ws:partial> @@ static "${node.__$ws_path.getFullPath()}"`;
        node.__$ws_internalTree = childContainer.getInternalStructure();
        node.__$ws_internal = wrapInternalExpressions(node.__$ws_internalTree.flatten());
    }

    visitDynamicPartial(node: Ast.DynamicPartialNode, context: IContext): void {
        const childContainer = this.processComponent(node, context);
        childContainer.registerProgram(node.__$ws_expression, ProgramType.OPTION, 'template');
        childContainer.desc = `<ws:partial> @@ dynamic "${node.__$ws_expression.string}"`;
        node.__$ws_internalTree = childContainer.getInternalStructure();
        node.__$ws_internal = wrapInternalExpressions(node.__$ws_internalTree.flatten());
        checkForTranslations(context.scope, node.__$ws_expression);
    }

    visitTemplate(node: Ast.TemplateNode, context: IContext): void {
        const container = context.container.createContainer(ContainerType.TEMPLATE);
        container.desc = `<ws:template> @@ "${node.__$ws_name}"`;
        const childContext: IContext = {
            childrenStorage: context.childrenStorage,
            scope: context.scope,
            container,
            counters: context.counters
        };
        this.stack.push(AbstractNodeType.DIRECTIVE);
        visitAll(node.__$ws_content, this, childContext);
        this.stack.pop();
        setRootNodeFlags(node.__$ws_content);
        node.__$ws_container = container;
        node.__$ws_internalTree = container.getInternalStructure();
        node.__$ws_internal = wrapInternalExpressions(node.__$ws_internalTree.flatten());
    }

    visitIf(node: Ast.IfNode, context: IContext): void {
        const container = context.container.createContainer(ContainerType.CONDITIONAL);
        container.desc = `<ws:if> "${node.__$ws_test.string}"`;
        container.registerTestProgram(node.__$ws_test);
        const childContext: IContext = {
            childrenStorage: context.childrenStorage,
            scope: context.scope,
            container,
            counters: context.counters
        };
        this.stack.push(AbstractNodeType.DIRECTIVE);
        visitAll(node.__$ws_consequent, this, childContext);
        this.stack.pop();
        node.__$ws_container = container;
        checkForTranslations(context.scope, node.__$ws_test);
    }

    visitElse(node: Ast.ElseNode, context: IContext): void {
        const container = context.container.createContainer(ContainerType.CONDITIONAL);
        container.desc = '<ws:else>';
        container.isElse = true;
        if (node.__$ws_test !== null) {
            container.desc = `<ws:else> "${node.__$ws_test.string}"`;
            container.registerTestProgram(node.__$ws_test);
        }
        const childContext: IContext = {
            childrenStorage: context.childrenStorage,
            scope: context.scope,
            container,
            counters: context.counters
        };
        this.stack.push(AbstractNodeType.DIRECTIVE);
        visitAll(node.__$ws_consequent, this, childContext);
        this.stack.pop();
        node.__$ws_container = container;
        checkForTranslations(context.scope, node.__$ws_test);
    }

    visitFor(node: Ast.ForNode, context: IContext): void {
        const container = context.container.createContainer(ContainerType.CYCLE);
        container.desc = '<ws:for> aka for';
        const childContext: IContext = {
            childrenStorage: context.childrenStorage,
            scope: context.scope,
            container,
            counters: context.counters
        };
        if (node.__$ws_init) {
            container.registerProgram(node.__$ws_init, ProgramType.FLOAT, 'data');
        }
        container.registerProgram(node.__$ws_test, ProgramType.FLOAT, 'data');
        if (node.__$ws_update) {
            container.registerProgram(node.__$ws_update, ProgramType.FLOAT, 'data');
        }
        this.stack.push(AbstractNodeType.DIRECTIVE);
        visitAll(node.__$ws_content, this, childContext);
        this.stack.pop();
        node.__$ws_container = container;
        node.__$ws_uniqueIndex = context.counters.allocateCycleIndex();
        checkForTranslations(context.scope, node.__$ws_init);
        checkForTranslations(context.scope, node.__$ws_test);
        checkForTranslations(context.scope, node.__$ws_update);
    }

    visitForeach(node: Ast.ForeachNode, context: IContext): void {
        const container = context.container.createContainer(ContainerType.CYCLE);
        container.desc = '<ws:for> aka foreach';
        const childContext: IContext = {
            childrenStorage: context.childrenStorage,
            scope: context.scope,
            container,
            counters: context.counters
        };
        if (node.__$ws_index) {
            container.addIdentifier(node.__$ws_index.string);
        }
        container.addIdentifier(node.__$ws_iterator.string);
        container.registerProgram(node.__$ws_collection, ProgramType.SIMPLE, 'data');
        this.stack.push(AbstractNodeType.DIRECTIVE);
        visitAll(node.__$ws_content, this, childContext);
        this.stack.pop();
        node.__$ws_container = container;
        node.__$ws_uniqueIndex = context.counters.allocateCycleIndex();
        checkForTranslations(context.scope, node.__$ws_collection);
    }

    visitArray(node: Ast.ArrayNode, context: IContext): void {
        this.stack.push(AbstractNodeType.DATA_TYPE_DIRECTIVE);
        visitAll(node.__$ws_elements, this, context);
        this.stack.pop();
    }

    visitBoolean(node: Ast.BooleanNode, context: IContext): void {
        this.stack.push(AbstractNodeType.DATA_TYPE_DIRECTIVE);
        visitAll(node.__$ws_data, this, context);
        this.stack.pop();
    }

    visitFunction(node: Ast.FunctionNode, context: IContext): void {
        this.stack.push(AbstractNodeType.DATA_TYPE_DIRECTIVE);
        visitAllProperties(node.__$ws_options, this, context);
        visitAll(node.__$ws_functionExpression, this, context);
        this.stack.pop();
    }

    visitNumber(node: Ast.NumberNode, context: IContext): void {
        this.stack.push(AbstractNodeType.DATA_TYPE_DIRECTIVE);
        visitAll(node.__$ws_data, this, context);
        this.stack.pop();
    }

    visitObject(node: Ast.ObjectNode, context: IContext): void {
        this.stack.push(AbstractNodeType.DATA_TYPE_DIRECTIVE);
        visitAllProperties(node.__$ws_properties, this, context);
        this.stack.pop();
    }

    visitString(node: Ast.StringNode, context: IContext): void {
        this.stack.push(AbstractNodeType.DATA_TYPE_DIRECTIVE);
        visitAll(node.__$ws_data, this, context);
        this.stack.pop();
    }

    visitValue(node: Ast.ValueNode, context: IContext): void {
        this.stack.push(AbstractNodeType.DATA_TYPE_DIRECTIVE);
        visitAll(node.__$ws_data, this, context);
        this.stack.pop();
    }

    visitText(node: Ast.TextNode, context: IContext): void {
        this.stack.push(AbstractNodeType.TEXT);
        visitAll(node.__$ws_content, this, context);
        this.stack.pop();
    }

    visitTextData(node: Ast.TextDataNode, context: IContext): void { }

    visitExpression(node: Ast.ExpressionNode, context: IContext): void {
        const programType = getProgramType(this.stack);
        const programName = programType === ProgramType.SIMPLE ? null : context.attributeName;
        context.container.registerProgram(node.__$ws_program, programType, programName);
        checkForTranslations(context.scope, node.__$ws_program);
    }

    visitTranslation(node: Ast.TranslationNode, context: IContext): void {
        // TODO: Collect translation keys on annotation stage.
        context.scope.setDetectedTranslation();
    }

    private processComponent(node: Ast.BaseWasabyElement, context: IContext): Container {
        const name = getComponentName(node);
        if (name !== null) {
            context.childrenStorage.push(name);
        }
        const container = context.container.createContainer(ContainerType.COMPONENT);
        const childContext: IContext = {
            childrenStorage: context.childrenStorage,
            scope: context.scope,
            container,
            counters: context.counters
        };
        this.stack.push(AbstractNodeType.COMPONENT);
        visitAllProperties(node.__$ws_attributes, this, childContext);
        visitAllProperties(node.__$ws_events, this, childContext);
        visitAllProperties(node.__$ws_options, this, childContext);
        visitAllProperties(node.__$ws_contents, this, childContext);
        this.stack.pop();
        node.__$ws_container = container;
        return container;
    }
}