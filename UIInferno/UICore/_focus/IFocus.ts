import { IGeneratorControlNode as IControlNode } from 'UICore/Executor';

export interface ICompoundControl {
    canAcceptFocus: Function;
    setActive: Function;
    isActive: Function;
    isDestroyed: Function;
}

export interface IFocusElement extends Element {
    setActive?: Function;
    focus?: Function;
}

export interface IMatchesElement extends Element {
    matchesSelector?: Function;
    msMatchesSelector?: Function;
    mozMatchesSelector?: Function;
    oMatchesSelector?: Function;
}

export interface IControlElement extends HTMLElement {
    wsControl?: ICompoundControl;
    controlNodes?: IControlNode;
}
