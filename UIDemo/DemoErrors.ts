/// <amd-module name="UIDemo/DemoErrors" />

// @ts-ignore
import {Control, TemplateFunction} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/DemoErrors');

// для упрощения, чтобы не мешать демо с темизацией используем обычную css
import 'css!UIDemo/DemoErrors';

class DemoErrors extends Control {
   public _template: TemplateFunction = template;

   public _caption: String = 'create error';
   public _hookError: Boolean = false;

   // шаблоны
   public _foundTemplate: String = '';
   public _notFoundTemplate: String = '';
   public _badTemplateName: String = '';

   /**
    * несуществующая переменная для генерации ошибки в _systemError
    */
   public _test: any;

   /**
    * Пустой обработчик
    */
   public _notFoundHandler1: any;

   public _beforeUpdate(): void {
      if (this._hookError) {
         // после ошибки внутри хука - страница теряет реактивность, нужно перезагрузить
         alert('Ошибка _beforeUpdate() ломает демо - перезагрузите страницу')
         throw new Error('Ошибка на хуке _beforeUpdate() в процессе работы');
      }
   };

   /**
    * Генерация ошибки хука
    */
   public _lifeError(): void {
      this._hookError = true;

      // @ts-ignore
      this._forceUpdate(); 
   };

   /**
    * Генерация ошибки по throw
    */
   public _notFoundHandler2(): void{
      let message = 'Ошибка по клику внутри обработчика. Произвольный текст';
      throw new Error(message);
   };

   /**
    * Генерация системной ошибки в js
    */
   public _systemError(): any {
      // _test === undefined
      return this._test.error;
   };

   /**
    * Загрузка шаблонов через partial
    * @param {EventObject} e
    * @param {String} typeError - признак типа ошибки
    */
   public _loadPartial(e, typeError): void {
      let badTemplateName = 'wml!UIDemo/resources/badTemplate';
      let foundTemplateName = 'wml!UIDemo/resources/found';
      switch (typeError) {
         case 'found':
            // первый клик не грузит контрол
            if (this._foundTemplate) {
               this._requireModule(foundTemplateName, '_foundTemplate');
            }

            this._foundTemplate = foundTemplateName;
            break;

         case 'notFound':
            this._notFoundTemplate = 'wml!UIDemo/resources/errorsNotFound';
            break;

         case 'errorTemplate':
            this._requireModule(badTemplateName, '_badTemplateName');
            break;

         default:
            break;
      }
   };

   /**
    * Загрузка модулей через require([...])
    * @param {String} link
    * @param {String} fieldState
    */
   public _requireModule(link, fieldState): void {
      var self = this;

      // @ts-ignore
      require([link], () => {
         self[fieldState] = link;

         // @ts-ignore
         self._forceUpdate(); 
      });
   };
};

export = DemoErrors;
