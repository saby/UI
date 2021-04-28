/**
 * Библиотека базового контрола
 * @library UICore/Base
 * @includes Control UICore/_base/Control
 * @includes Async UICore/_async/Async
 * @author Шипин А.А.
 */

export {
    default as Control,
    IControlChildren,
    IControlConstructor
} from './_base/Control';

export { getGeneratorConfig } from './_base/GeneratorConfig';

export { default as startApplication } from './_base/startApplication';

export { default as Async, IAsyncOptions, TAsyncStateReceived } from 'UICore/_async/Async';
