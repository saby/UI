function needToBeCompatible(parent) {
   if (typeof window === 'undefined') {
      return false;
   }

   const isWs3 = parent && !!parent.setActive && !!parent._hasMarkup && !!parent._registerToParent;
   const parentHasCompat = !!(parent && typeof parent.hasCompatible === 'function' && parent.hasCompatible());

   // создаем контрол совместимым только если родитель - ws3-контрол или совместимый wasaby-контрол
   return (isWs3 || parentHasCompat);
}
export default needToBeCompatible;