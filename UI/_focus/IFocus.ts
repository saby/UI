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

export interface IControlElement extends Element {
   wsControl?: any;
   controlNodes?: any;
}
