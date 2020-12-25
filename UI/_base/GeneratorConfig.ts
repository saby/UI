// tslint:disable:no-any
import { _IGeneratorType } from 'UI/Executor';
import { _FocusAttrs } from 'UI/Focus';
import { cookie } from 'Env/Env';

const _generatorConfig = {
   prepareAttrsForPartial: function prepareAttrsForPartial(attributes: any): void {
      return _FocusAttrs.prepareAttrsForFocus(attributes.attributes);
   }
};
const _oldPrepareAttrsForPartial = _generatorConfig.prepareAttrsForPartial;
const _generatorConfig2 = {
   prepareAttrsForPartial: function prepareAttrsForPartial(attributes: any): void {
      _oldPrepareAttrsForPartial.apply(this, arguments);

      Object.keys(attributes.events).forEach((key) => {
         const event = attributes.events[key];
         // tslint:disable-next-line:no-shadowed-variable
         return event.forEach((event) => {
            if (event.hasOwnProperty('data')) {
               let attrName = key.replace('on:', 'binded:');
               attrName += '-logicparent:';
               attrName += event.viewController._moduleName.replace(/\//g, '_');
               attributes.attributes[attrName] = event.bindValue;
            }
         });
      });
   }
};

let _bindToAttribute;
function bindToAttribute(): string {
   if (typeof _bindToAttribute === 'undefined') {
      _bindToAttribute = cookie.get('bindToAttribute') || 'false';
   }
   return _bindToAttribute;
}

function getGeneratorConfig(): _IGeneratorType.IGeneratorConfig {
   let generatorConfig = _generatorConfig;
   if (bindToAttribute() === 'true') {
      generatorConfig = _generatorConfig2;
   }
   return generatorConfig;
}
export {
   getGeneratorConfig
};
