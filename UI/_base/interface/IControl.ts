import { _IControl } from 'UI/Focus';

/**
 * Basic interface for all controls
 */
export interface IControl<IControlOptions={}> extends _IControl {
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
export interface IControlChildren extends Record<string, IControl<IControlOptions|void> | HTMLElement> {
}