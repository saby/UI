import { _IControl } from 'UI/Focus';

/**
 * Basic interface for all controls
 */
export interface IControl<TChildren> extends _IControl {
   /**
    * {IControlChildren} property containing current control children
    */
   _children: TChildren;
}

/**
 * Basic interface for control options
 */
export interface IControlOptions {
   /**
    * {Boolean} Determines whether user can change control's value
    */
   readOnly?: boolean;
   /**
    * {String} Theme name. Depending on the theme, different stylesheets are loaded and
    */
   theme?: string;
}

/**
 * Basic interface for child controls
 */
export interface IControlChildren extends Record<string, IControl<IControlChildren> | HTMLElement> {
}