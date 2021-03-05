/// <amd-module name="UI/_base/HTML/meta" />
/**
 * Библиотека контроллера meta тегов страницы
 * @remark
 * @library UI/_base/HTML/meta
 * @includes getMetaStack getMetaStack
 * @includes IMetaStack UI/_base/HTML/_meta/IMetaStack
 * @public
 * @author Ибрагимов А.А.
 */
export { default as State } from 'UI/_base/HTML/_meta/State';
import Stack from 'UI/_base/HTML/_meta/Stack';
import { IMetaStack, IMetaStackInternal, IMeta, IOpenGraph, IMetaState } from 'UI/_base/HTML/_meta/interface';
export { Stack, IMetaStack, IMetaStackInternal, IMeta, IOpenGraph, IMetaState };
import { ResourceMeta } from 'UI/_base/HTML/_meta/ResourceMeta';
export { ResourceMeta };
/**
 * Возвращает MetaStack (singleton)
 * @name UI/_base/HTML/meta#getMetaStack
 * @function
 * @returns {UI/_base/HTML/_meta/IMetaStack}
 */
export const getMetaStack: () => IMetaStack = Stack.getInstance;
