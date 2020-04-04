/// <amd-module name="UI/_base/HTML/meta" />
/**
 * Библиотека контроллера meta тегов страницы
 * @remark
 * @library UI/_base/HTML/meta
 * @includes State UI/_base/HTML/_meta/State
 * @includes Stack UI/_base/HTML/_meta/Stack
 * @includes deserializeState UI/_base/HTML/_meta/State#deserializeState
 * @public
 * @author Ибрагимов А.А.
 */
import Stack from 'UI/_base/HTML/_meta/Stack';
export const metaStack = Stack.getInstance();
export { IMeta } from 'UI/_base/HTML/_meta/interface';
export { default as State, deserializeState } from 'UI/_base/HTML/_meta/State';
