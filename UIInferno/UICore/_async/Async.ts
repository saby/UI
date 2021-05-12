/// <amd-module name='UICore/_async/Async' />
import * as ModulesLoader from 'WasabyLoader/ModulesLoader';
import * as Library from 'WasabyLoader/Library';
import { IoC, constants } from 'Env/Env';
import { descriptor } from 'Types/entity';
import { Control } from 'UICore/Base';
import { IControlOptions, TemplateFunction } from 'UICommon/Base';
import { headDataStore } from 'UI/Deps';
import template = require('wml!UICore/_async/Async');

function generateErrorMsg(templateName: string, msg?: string): string {
   const tTemplate = `Ошибка загрузки контрола "${templateName}"`;
   const tHint = 'Возможны следующие причины:\n\t \
                  • Ошибка в самом контроле\n\t \
                  • Долго отвечал БЛ метод в _beforeUpdate\n\t \
                  • Контрола не существует';
   return !msg ? `${tTemplate}\n${tHint}` : `${tTemplate}: ${msg}`;
}

export type TAsyncStateReceived = boolean | string;

export interface IAsyncOptions extends IControlOptions {
   templateName: string;
   templateOptions: IControlOptions;
}

const SUCCESS_BUILDED = 's';

/**
 * Абстрактная реализация контейнера для асинхронной загрузки контролов.
 * !Важно: нельзя использовать этот контейнер напрямую! Необходимо использовать {@link Controls/Container/Async}
 * @see Controls/Container/Async
 * Подробное описание и примеры вы можете найти <a href='/doc/platform/developmentapl/interface-development/pattern-and-practice/async-load/'>здесь</a>.
 *
 * @class UICore/Async:Async
 *
 * @public
 * @author Санников К.А.
 */
export default abstract class Async extends Control<IAsyncOptions, TAsyncStateReceived> {
   /**
    * @event UICore/Async:Async#load Событие оповещения, что указанный в templateName шаблон загружен и вставлен в DOM
    */

   protected _template: TemplateFunction = template;
   protected currentTemplateName: string;
   protected optionsForComponent: Record<string, unknown> = {};
   /**
    * Флаг для того, чтобы избежать повторной загрузки шаблона, при изменении опций до окончания асинхронной загрузки
    */
   private asyncLoading: boolean = false;
   /**
    * Флаг, о том, что произошла ошибка при загрузке модуля - чтобы не было циклической попытки загрузки
    */
   private loadingErrorOccurred: boolean = false;
   protected error: TAsyncStateReceived | void;
   protected userErrorMessage: string | void;
   protected defaultErrorMessage: string = 'У СБИС возникла проблема';
   /**
    * Флаг чтобы понимать, что был загружен контрол и вставлен на страницу -
    * т.к. после монтирования в DOM нужно будет опубликовать событие load
    * @private
    */
   private needNotifyOnLoad: boolean = false;

   protected _beforeMount(options: IAsyncOptions, _: unknown, receivedState: TAsyncStateReceived): Promise<TAsyncStateReceived> {
      if (!options.templateName) {
         this.error = 'В модуль Async передали не корректное имя шаблона (templateName=undefined|null|empty)';
         IoC.resolve('ILogger').error(this.error);
         return Promise.resolve(this.error);
      }

      if (receivedState && receivedState !== SUCCESS_BUILDED) {
         IoC.resolve('ILogger').error(receivedState);
      }

      if (constants.isBrowserPlatform && (!ModulesLoader.isLoaded(options.templateName) ||
         this._isCompat() || !receivedState)) {
         return this._loadContentAsync(options.templateName, options.templateOptions);
      }

      this.error = this._loadContentSync(options.templateName, options.templateOptions);
      if (this.error) {
         this.userErrorMessage = this.defaultErrorMessage;
         return Promise.resolve(this.error);
      }

      return Promise.resolve(SUCCESS_BUILDED);
   }

   protected _componentDidMount(): void {
      this._notifyOnLoad();
   }

   /**
    * Если можем подставить данные при изменении синхронно, то делаем это до обновления
    * @param {*} opts
    */
   protected _beforeUpdate(opts: IAsyncOptions): void {
      if (this.asyncLoading) {
         return;
      }

      if (opts.templateName === this.currentTemplateName) {
         // поменялись только опции шаблона
         this._insertComponent(this.optionsForComponent.resolvedTemplate,
            opts.templateOptions,
            opts.templateName);
         return;
      }

      if (ModulesLoader.isLoaded(opts.templateName)) {
         this._loadContentSync(opts.templateName, opts.templateOptions);
      }
   }

   /**
    * Если до обновления не загрузили синхронно, то пробуем загрузить асинхронно
    */
   protected _afterUpdate(): void {
      if (this.asyncLoading) {
         return;
      }
      if (this.loadingErrorOccurred) {
         this.loadingErrorOccurred = false;
         return;
      }
      if (this.currentTemplateName === this._options.templateName) {
         this._notifyOnLoad();
         return;
      }

      this._loadContentAsync(this._options.templateName, this._options.templateOptions).then(() => {
         this._forceUpdate();
      });
   }

   protected _notifyOnLoad(): void {
      if (this.needNotifyOnLoad && !this.error && !this.asyncLoading) {
         this.needNotifyOnLoad = false;
         this._notify('load');
      }
   }

   protected _loadContentSync(name: string, options: IControlOptions): TAsyncStateReceived {
      const loaded = this._loadSync(name);
      if (loaded === null) {
         return generateErrorMsg(name);
      }

      this.needNotifyOnLoad = true;
      this._insertComponent(loaded, options, name);
      this._pushDepToHeadData(Library.parse(name).name);
      return false;
   }

   protected _loadSync<T = unknown>(name: string): T {
      try {
         const loaded = ModulesLoader.loadSync<T>(name);
         if (loaded) {
            return loaded;
         }
      } catch (err) {
         IoC.resolve('ILogger').error(`Couldn't load module "${name}"`, err);
      }
      return null;
   }

   protected _loadContentAsync(name: string, options: IControlOptions): Promise<TAsyncStateReceived> {
      // Need this flag to prevent setting new options for content
      // that wasn't loaded yet
      this.asyncLoading = true;
      this.loadingErrorOccurred = false;

      return this._loadAsync(name).then<TAsyncStateReceived, TAsyncStateReceived>((loaded) => {
         this.asyncLoading = false;
         if (!loaded) {
            this.loadingErrorOccurred = true;
            this.error = generateErrorMsg(name);
            IoC.resolve('ILogger').warn(this.error);
            this.userErrorMessage = this.defaultErrorMessage;
            return this.error;
         }

         this.needNotifyOnLoad = true;
         this._insertComponent(loaded, options, name);
         return true;
      }, (err) => {
         this.asyncLoading = false;
         this.loadingErrorOccurred = true;
         this.error = generateErrorMsg(name);
         this.userErrorMessage = err.message;
         return err;
      });
   }

   protected _loadAsync(name: string): Promise<unknown> {
      return ModulesLoader.loadAsync(name).catch((error) => {
         IoC.resolve('ILogger').error(`Couldn't load module "${name}"`, error);
         ModulesLoader.unloadSync(name);
         throw new Error(this.defaultErrorMessage);
      });
   }

   protected _pushDepToHeadData(dep: string): void {
      if (constants.isBrowserPlatform) {
         return;
      }

      try {
         headDataStore.read('pushDepComponent')(dep, true);
      } catch (e) {
         IoC.resolve('ILogger').warn('You\'re trying to use Async without Controls/Application. Link to ' +
            dep +
            ' won\'t be added to server-side generated markup. ' + e);
      }
   }

   protected _insertComponent(tpl: unknown, opts: IControlOptions, templateName: string): void {
      this.error = '';
      this.currentTemplateName = templateName;
      this.optionsForComponent = {};
      for (const key in opts) {
         if (opts.hasOwnProperty(key)) {
            this.optionsForComponent[key] = opts[key];
         }
      }

      if (tpl && tpl['__esModule']) {
         this.optionsForComponent.resolvedTemplate = tpl['default'];
         return;
      }
      this.optionsForComponent.resolvedTemplate = tpl;
   }

   protected _isCompat(): boolean {
      return constants.compat;
   }

   static getOptionTypes(): Record<string, unknown> {
      return {
         templateName: descriptor(String).required()
      };
   }
}

/**
 * @name UICore/Async:Async#content
 * @cfg {String} Содержимое контейнера.
 */

/**
 * @name UICore/Async:Async#templateName
 * @cfg {String} Имя асинхронно загружаемого контрола.
 * Можно использовать только {@link /doc/platform/developmentapl/interface-development/pattern-and-practice/javascript-libraries/#_2 публичные пути библиотеки}.
 */

/**
 * @name UICore/Async:Async#templateOptions
 * @cfg {Object} Параметры содержимого контейнера Async.
 */
