import { constants } from 'Env/Env';

/**
 * @author Шипин А.А.
 */
function needToBeCompatible(cnstr, parent, iWantBeWS3 = false) {
   var moduleName = cnstr.prototype._moduleName;
   if (iWantBeWS3 === true) {
      return true;
   }
   if (moduleName === 'Controls/compatiblePopup:CompoundArea' || moduleName === 'Core/CompoundContainer') {
      return true;
   }
   if (!constants.compat) {
      return false;
   }

   const isWs3 = parent && !!parent.setActive && !!parent._hasMarkup && !!parent._registerToParent;
   const parentHasCompat = !!(parent && typeof parent.hasCompatible === 'function' && parent.hasCompatible());

   // создаем контрол совместимым только если родитель - ws3-контрол или совместимый wasaby-контрол
   return (isWs3 || parentHasCompat);
}
export default needToBeCompatible;