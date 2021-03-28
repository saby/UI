/**
 * Библиотека функций, помогающих избавляться от утечки памяти.
 * @class UICore/_utils/Purifier
 * @public
 * @author Кондаков Р.Н.
 */

export { default as purifyInstance } from './Purifier/purifyInstance';
export { default as needLog, canPurifyInstanceSync } from './Purifier/needLog';
