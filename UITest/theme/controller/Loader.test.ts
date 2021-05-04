import { assert } from 'chai';
import Loader from 'UICommon/theme/_controller/Loader';
import { EMPTY_THEME } from 'UICommon/theme/_controller/css/const';

describe('UICommon/theme/_controller/Loader', () => {
   const loader = new Loader();
   const theme_name = 'themeName';
   const first_name = 'Root';
   const last_name = 'control';
   const mod = 'modificaton';
   describe('getHref', () => {
      it('Не меняет путь, содержащий .css (загрузка rt-пакетов)', () => {
         const link = 'some/style.css';
         assert.include(
            loader.getHref(link, theme_name), link);
      });

      it('Разрешает путь до темизированных стилей', () => {
         assert.include(
            loader.getHref(`${first_name}/${last_name}`, theme_name), 
            `${first_name}-${theme_name}-theme/${last_name}.css`
         );
      });
      it('Разрешает путь до темизированных стилей с модификацией', () => {
         assert.include(
            loader.getHref(`${first_name}/${last_name}`, `${theme_name}__${mod}`),
            `${first_name}-${theme_name}-theme/${mod}/${last_name}.css`
         );
      });
      it('Разрешает путь до нетемизированных стилей', () => {
         assert.include(
            loader.getHref(`${first_name}/${last_name}`, EMPTY_THEME),
            `${first_name}/${last_name}.css`
         );
      });
   });
});