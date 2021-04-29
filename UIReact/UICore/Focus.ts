interface IFocusElementProps {
   enabled: boolean;
   tabStop: boolean;
   createsContext: boolean;
   tabIndex: number;
   delegateFocusToChildren: boolean;
   tabCycling: boolean;
}

import { Control } from 'UICore/Base';

// TODO: заменить экспорт во время реализации системы фокусов для Реакта.
export const ElementFinder = {
   getElementProps(
      element: HTMLElement
   ): IFocusElementProps {
      throw new Error('Метод ElementFinder.getElementProps ещё не реализован в системе фокусов для Реакта');
   },
   findFirstInContext(
      contextElement: HTMLElement,
      reverse?: boolean,
      propsGetter?: (element: HTMLElement, tabbable: boolean) => IFocusElementProps,
      tabbable?: boolean
   ): HTMLElement {
      throw new Error('Метод ElementFinder.findFirstInContext ещё не реализован в системе фокусов для Реакта');
   },
   findWithContexts(
      rootElement: HTMLElement,
      fromElement: Element,
      reverse: boolean,
      propsGetter?: (element: HTMLElement, tabbable: boolean) => IFocusElementProps,
      tabbable?: boolean
   ): HTMLElement {
      throw new Error('Метод ElementFinder.findWithContexts ещё не реализован в системе фокусов для Реакта');
   }
};

// TODO: заменить экспорт во время реализации системы фокусов для Реакта.
export function focus(
   element: HTMLElement,
   cfg?: {
      enableScreenKeyboard?: boolean,
      enableScrollToElement?: boolean
   }
): boolean {
   throw new Error('Метод focus ещё не реализован в системе фокусов для Реакта');
}

// TODO: заменить экспорт во время реализации системы фокусов для Реакта.
export const _FocusAttrs = {
   prepareAttrsForFocus(attributes: Record<string, string>): void {
      throw new Error('Метод _FocusAttrs.prepareAttrsForFocus ещё не реализован в системе фокусов для Реакта');
   },
   prepareTabindex(attrs: Record<string, string>): void {
      throw new Error('Метод _FocusAttrs.prepareTabindex ещё не реализован в системе фокусов для Реакта');
   },
   patchDom(dom: HTMLElement): void {
      throw new Error('Метод _FocusAttrs.patchDom ещё не реализован в системе фокусов для Реакта');
   }
};

// TODO: заменить экспорт во время реализации системы фокусов для Реакта.
export function nativeFocus(
   options?: {
      preventScroll?: boolean
   }
): void {
   throw new Error('Метод nativeFocus ещё не реализован в системе фокусов для Реакта');
}

// TODO: заменить экспорт во время реализации системы фокусов для Реакта.
export function activate(
   element: HTMLElement,
   cfg?: {
      enableScreenKeyboard?: boolean,
      enableScrollToElement?: boolean
   }
): boolean {
   throw new Error('Метод activate ещё не реализован в системе фокусов для Реакта');
}

export { goUpByControlTree } from 'UICore/NodeCollector';

// TODO: заменить экспорт во время реализации системы фокусов для Реакта.
export const DefaultOpenerFinder = {
   find(control: Control | HTMLElement | HTMLElement[]): Control {
      throw new Error('Метод DefaultOpenerFinder.find ещё не реализован в системе фокусов для Реакта');
   }
};
