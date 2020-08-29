/**
 * Библиотека функций, помогающих избавляться от утечки памяти.
 * @class UI/_utils/Purifier
 * @author Кондаков Р.Н.
 */

export { default as purifyInstance, exploreAfterDestroyInstance } from './Purifier/purifyInstance';
export { default as needLog, canPurifyInstanceSync } from './Purifier/needLog';
