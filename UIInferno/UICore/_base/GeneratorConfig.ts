// tslint:disable:no-any
import { _IGeneratorType } from 'UICore/Executor';
import { _FocusAttrs } from 'UICore/Focus';
import { cookie } from 'Env/Env';

function prepareAttrsForPartial(attributes: any): void {
   return _FocusAttrs.prepareAttrsForFocus(attributes.attributes);
}
function prepareAttrsForRoot(attributes: any, options: any): void {
   attributes.attributes.class = attributes.attributes.class || '';
   if (typeof options.theme === 'string') {
      const themeName = 'controls_theme-' + options.theme;
      if (attributes.attributes.class.indexOf(themeName) === -1) {
         attributes.attributes.class = attributes.attributes.class + ' ' + themeName;
      }
   }
}
const _generatorConfig = {
   prepareAttrsForPartial,
   prepareAttrsForRoot
};
function prepareAttrsForPartial2(attributes: any): void {
   prepareAttrsForPartial.apply(this, arguments);

   if (attributes.events) {
      Object.keys(attributes.events).forEach((key) => {
         const event = attributes.events[key];
         // tslint:disable-next-line:no-shadowed-variable
         return event.forEach((event) => {
            if (event.hasOwnProperty('data')) {
               const attrName = key.replace('on:', 'data-qa-');
               attributes.attributes[attrName] = attributes.attributes[attrName] || event.bindValue;
            }
         });
      });
   }
}

let _bindToAttribute;
function bindToAttribute(): string {
   if (typeof _bindToAttribute === 'undefined') {
      _bindToAttribute = cookie.get('bindToAttribute') || 'false';
   }
   return _bindToAttribute;
}

function getGeneratorConfig(): _IGeneratorType.IGeneratorConfig {
   if (bindToAttribute() === 'true') {
      _generatorConfig.prepareAttrsForPartial = prepareAttrsForPartial2;
   }
   return _generatorConfig;
}
export {
   getGeneratorConfig
};
