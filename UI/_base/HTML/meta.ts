/// <amd-module name="UI/_base/HTML/meta" />
/**
 * Библиотека контроллера meta тегов страницы
 * @remark
 * @library UI/_base/HTML/meta
 * @includes getMetaStack UI/_base/HTML/_meta/interface#IMetaStack
 * @includes IMeta UI/_base/HTML/_meta/interface#IMeta
 * @includes IMetaState UI/_base/HTML/_meta/interface#IMetaState
 * @public
 * @author Ибрагимов А.А.
 */
export { default as State } from 'UI/_base/HTML/_meta/State';
import Stack from 'UI/_base/HTML/_meta/Stack';
import { IMetaStack, IMeta, IOpenGraph, IMetaState } from 'UI/_base/HTML/_meta/interface';
export { Stack, IMetaStack, IMeta, IOpenGraph, IMetaState };
export const getMetaStack: () => IMetaStack = Stack.getInstance;
