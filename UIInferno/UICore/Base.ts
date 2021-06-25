/**
 * Библиотека базового контрола
 * @library UICore/Base
 * @includes Control UICore/_base/Control
 * @author Шипин А.А.
 */

export {
    default as Control,
    IControlChildren,
    IControlConstructor
} from './_base/Control';

export { getGeneratorConfig } from './_base/GeneratorConfig';
export { default as WasabyPortal } from './_base/WasabyPortal';

export { default as startApplication, selectRenderDomNode } from './_base/startApplication';
