/// <amd-module name="UI/_base/HTML/meta" />
/**
 * Библиотека контроллера meta тегов страницы
 * @remark
 * Для работы с метаданными страницы необходимо:
 * вызвать функцию getMetaStack, который возвращает синглтон MetaStack и использовать его API:
 * push(IMeta): IMetaState - для добавления метаданных
 * remove(IMetaState): void - для удаления метаданных
 * @library UI/_base/HTML/meta
 * @includes getMetaStack getMetaStack
 * @public
 * @faq Как добавлять мета данные на страницу? Как сейчас реализована работа с метаданными?
 * По общему правилу нужно вызвать функцию getMetaStack, который возвращает синглтон MetaStack и использовать его API (push, remove).
 * Но нередко metastack уже реализован на платформенном уровен, и скорее всего нет необходимости обращаться к этому API напрямую,
 * а вместо этого нужно будет пробрасывать метаданные в компонент-обертку приложения. Например {@link SbisEnvUI/Bootstrap SbisEnvUI/Bootstrap}.
 * @author Печеркин С.В.
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
