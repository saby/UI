/**
 * Библиотека фокусов
 * @library UI/Focus
 * @includes Focus UICore/Focus
 * @public
 * @author Кондаков Р.Н.
 */

export {
   ElementFinder,
   Events,
   BoundaryElements,
   focus,
   prepareRestoreFocusBeforeRedraw,
   restoreFocusAfterRedraw,
   _initFocus,
   _IControl,
   _FocusAttrs,
   nativeFocus,
   activate,
   preventFocus,
   hasNoFocus,
   goUpByControlTree,
   DefaultOpenerFinder
} from 'UICore/Focus';
