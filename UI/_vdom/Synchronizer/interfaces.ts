import Control, { IControlOptions } from 'UICore/Base';
import { IOptions } from 'UI/_vdom/Synchronizer/resources/Options';
export { IOptions } from 'UI/_vdom/Synchronizer/resources/Options';
import { VNode } from 'Inferno/third-party/index';
import { IGeneratorControlNode } from "UI/_executor/_Markup/Vdom/IVdomType";
import { IWasabyEventSystem } from 'UI/Events';

export type TComponentAttrs = Record<string, unknown>;

export type TControlId = string;
// VdomMarkup.getDecoratedMark
// tslint:disable: member-ordering

type IControlConstructor = () => Control;
type TContext = Record<string, object>;
type IObjectsVersions<T> = {
    [key in keyof T]: number
};

export interface IAttrs extends Object {
    // @ts-ignore
    [key: string]: any;
}

export interface IRootAttrs extends IAttrs {
    ['data-component']?: string | null;
}

interface IRebuildNode {
    rootId: number;  // это добавляет какой то Syncronizer
    requestDirtyCheck: (controlNode: IRebuildNode) => void;  // это добавляет какой то Syncronizer
}

interface ICoreControlOptions extends IControlOptions {
    [key: string]: unknown;
}

export interface IControlNode extends IRebuildNode {
    attributes: any;
    events: TEventsObject;
    control: Control;
    contextVersions: IObjectsVersions<TContext>;
    context: TContext;
    oldContext: TContext;
    errors: object | undefined;
    element: IWasabyHTMLElement;
    controlClass: IControlConstructor;
    options: IOptions;
    oldOptions: IOptions;
    internalOptions: ICoreControlOptions;
    optionsVersions: IObjectsVersions<ICoreControlOptions>;
    inheritOptions: ICoreControlOptions;
    internalVersions: IObjectsVersions<ICoreControlOptions>;
    id: TControlId;
    parent: IControlNode;
    key: TControlId;
    defaultOptions: ICoreControlOptions;
    markup: VNode | undefined;
    fullMarkup: VNode | undefined;
    childrenNodes: IControlNode[];
    markupDecorator: Function;
    serializedChildren: IControlNode[];
    hasCompound: false;
    receivedState: undefined;
    invisible: boolean;
    vnode: IGeneratorControlNode;
    environment: IDOMEnvironment;

    // TODO это нужно вынести в расширенные интерфейсы
    _moduleName?: string;  // это добавляет какой то Executor

    // мы не должны зависить от UI/Focus._IDOMEnvironment, поэтому определю тут
    _rootDOMNode: TModifyHTMLNode;
    __captureEventHandler: Function;
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

// Наверное, здесь им здесь не место, но для рефактора Hooks они были срочно нужны.
export interface IEvent {
    args: any[];
    controlNode: IControlNode;
    fn: () => void;
    name: string;
    toPartial?: boolean;
    value: string;
}

export type TEventsObject = Record<string, IEvent[]>;

export interface IWasabyHTMLElement extends HTMLElement {
    controlNodes: IControlNode[];
    eventProperties: TEventsObject;
    eventPropertiesCnt: number;
}

export interface IProperties {
    attributes: Record<string, string>;
    hooks: Record<string, any>;
    events: TEventsObject;
}

export type TModifyHTMLNode = HTMLElement & Record<string, any>;

export type TMarkupNodeDecoratorFn = (
    tagName: string,
    properties: IProperties,
    children: any,
    key: TControlId,
    controlNode: any,
    ref: any
) => VNode[];

export interface IHandlerInfo {
    handler: (evt: Event) => void;
    bodyEvent: boolean;
    processingHandler: boolean;
    count: number;
}
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

export interface IDOMEnvironment {
    destroy(): void;

    setRebuildIgnoreId(id: string): void;

    _handleFocusEvent(e: any): void;
    _handleBlurEvent(e: any): void;
    _handleMouseDown(e: any): void;

    decorateFullMarkup(vnode: VNode, controlNode: any): VNode;
    getMarkupNodeDecorator(): TMarkupNodeDecoratorFn;
    getDOMNode(): HTMLElement;

    _canDestroy(destroyedControl: Control): any;

    setupControlNode(controlNode: IControlNode): void;

    applyNodeMemo(nodeMemo: IMemoNode, devtoolCallback: Function): void;

    showCapturedEvents(): Record<string, IHandlerInfo[]>;

    queue: TControlId[];

    _currentDirties: Record<string, number>;
    _nextDirties: Record<string, number>;

    // FIXME это не должно быть публичным. Найти все ссылки и разобраться
    _rootDOMNode: TModifyHTMLNode;
    __captureEventHandler: Function;
    _rebuildRequestStarted?: boolean;
    _haveRebuildRequest?: boolean;
    eventSystem: IWasabyEventSystem;
}
