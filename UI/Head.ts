/**
 * Библиотека заголовков страницы
 * @library UI/Head
 * @includes applyHeadJson UI/_head/defaultTags
 * @includes createMetaScriptsAndLinks UI/_head/defaultTags
 * @public
 * @author Печеркин С.В.
 */
export { createWsConfig } from 'UI/_head/wsConfig';
export { createTitle, createViewPort, createDefaultTags,
         createMetaScriptsAndLinks, applyHeadJson } from 'UI/_head/defaultTags';
export { IHeadOptions } from 'UI/_head/Interface';
