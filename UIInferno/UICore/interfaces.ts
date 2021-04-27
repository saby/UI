import {
    TControlConstructor,
    TControlId,
    IProperties,
    ICommonControlNode,
    ICommonDOMEnvironment,
    TModifyHTMLNode
} from 'UICommon/interfaces';
import { Control } from 'UICore/Base';
import { IGeneratorControlNode } from 'UICore/Executor';
import { IWasabyEventSystem } from 'UICommon/Events';
import { VNode } from 'Inferno/third-party/index';

export type TComponentAttrs = Record<string, unknown>;

export interface ITemplateAttrs {
    key?: string;
    internal?: Record<string, any>;
    inheritOptions?: Record<string, any>;
    attributes?: Record<string, any>;
    templateContext?: Record<string, any>;
    context?: Record<string, any>;
    domNodeProps?: Record<string, any>;
    events?: Record<string, any>;
}

export interface IControlNode extends ICommonControlNode {
    controlClass: TControlConstructor;
    parent: IControlNode;
    markup: VNode | undefined;
    fullMarkup: VNode | undefined;
    childrenNodes: IControlNode[];
    serializedChildren: IControlNode[];
    vnode: IGeneratorControlNode;
    environment: IDOMEnvironment;
}

export interface IAttrs extends Object {
    // @ts-ignore
    [key: string]: any;
}

export interface ICompatableControl {
    _parent?: ICompatableControl;
    hasCompatible(): boolean;
    isDestroyed(): boolean;
}

export interface ICompatableNode {
    control: ICompatableControl;
}

export type TControlStateCollback = (nodeId: TControlId) => void;

export type TMarkupNodeDecoratorFn = (
    tagName: string,
    properties: IProperties,
    children: any,
    key: TControlId,
    controlNode: any,
    ref: any
) => VNode[];

export interface IMemoForNode {
    createdNodes: IControlNode[];
    destroyedNodes: IControlNode[];
    selfDirtyNodes: IControlNode[];
    updatedChangedNodes: IControlNode[];
    updatedNodes: IControlNode[];
    updatedUnchangedNodes: IControlNode[];
    notUpdatedGNodes: IGeneratorControlNode[];
}
export interface IMemoNode {
    memo: IMemoForNode;
    value: IControlNode;
    getChangedCNodeIds(): Set<TControlId | 0>;
}

export interface IDOMEnvironment extends ICommonDOMEnvironment {
    decorateFullMarkup(vnode: VNode, controlNode: any): VNode;
    getMarkupNodeDecorator(): TMarkupNodeDecoratorFn;

    _canDestroy(destroyedControl: Control): any;

    setupControlNode(controlNode: IControlNode): void;

    applyNodeMemo(nodeMemo: IMemoNode, devtoolCallback: Function): void;
}
