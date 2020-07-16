import { Control, IControlOptions } from 'UI/Base';
import { VNode } from 'Inferno/third-party/index';
import { IDOMEnvironment } from './resources/DOMEnvironment';

export type TComponentAttrs = Record<string, unknown>;

export type TControlId = string;
// VdomMarkup.getDecoratedMark
export interface ITextNode {
    childFlags: 8;
    children: Array<Record<string, any>>;
    className: string;
    dom: null;
    flags: number;
    key: string;
    props: Record<string, string>;
    ref: Function;
    type: string;
    markup: undefined;
    hprops: object;
}

type IControlConstructor = () => Control;
type TContext = Record<string, object>;
type IObjectsVersions<T> = {
    [key in keyof T]: number
};

export interface IControlNodeOptions extends Record<string, unknown> {
}

interface IRebuildNode {
    rootId: number;  // это добавляет какой то Syncronizer
    requestDirtyCheck: (controlNode: IRebuildNode) => void;  // это добавляет какой то Syncronizer
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
    options: IControlNodeOptions;
    oldOptions: IControlNodeOptions;
    internalOptions: IControlOptions;
    optionsVersions: IObjectsVersions<IControlOptions>;
    inheritOptions: IControlOptions;
    id: TControlId;
    parent: IControlNode;
    key: TControlId;
    defaultOptions: IControlOptions;
    markup: ITextNode | undefined;
    fullMarkup: VNode | undefined;
    childrenNodes: IControlNode[];
    markupDecorator: Function;
    serializedChildren: IControlNode[];
    hasCompound: false;
    receivedState: undefined;
    invisible: boolean;
    vnode: VNode;
    environment: IDOMEnvironment;

    // TODO это нужно вынести в расширенные интерфейсы
    _moduleName?: string;  // это добавляет какой то Executor
}

export interface ICompatableControl {
    _parent?: ICompatableControl;
    hasCompatible(): () => boolean;
    isDestroyed: () => any;
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
