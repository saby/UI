/// <amd-module name="UI/_base/HTML" />

// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import Control from './Control';

// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import template = require('wml!UI/_base/HTML/HTML');
// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import {constants, detection} from 'Env/Env';
import { LinkResolver } from 'UI/theme/controller';
import { getResourceUrl } from 'UI/Utils';
import AppData from './AppData';
import {IHTMLOptions, ILinksAttrsHTML, IScriptsAttrsHTML} from './interface/IHTML';
import { IRootTemplateOptions } from './interface/IRootTemplate';
import { headDataStore } from 'UI/_base/HeadData';
import mountChecker from 'UI/_base/MountChecker';
import { Stack as MetaStack, IMetaStackInternal } from 'UI/_base/HTML/meta';
import { Body as AppBody } from 'Application/Page';

// Бывают ситуации, когда страницу открыли и сразу перешли на другую вкладку или перевели компьютер в режим сна.
// У открытой страницы в фоновом режиме начинают по таймауту отваливаться запросы и страница в итоге не оживает.
// Для обработки таких ситуаций запустим скрипт, который перезагрузит страницу, если она не оживет за отведенное время.
// Проверку запускается сразу при загрузке файла, т.к. если построение страницы упадет, _beforeMount может не
// выполниться. Если шаблон страницы построился, то в _afterMount мы остановим проверку, т.к. страница рабочая и
// проверять что-то больше не надо.
mountChecker.start();

interface IHTMLCombinedOptions extends IHTMLOptions, IRootTemplateOptions {
    defaultTheme: string;
    // Добавим здесь поля для RUM-статистики.
    // Потому что их нам нужно сериализовать в wsConfig, чтобы потом получить на клиенте.
    RUMEnabled: boolean;
    pageName: string;
    title: string;
    /** Require зависимости, определенные в rt-пакетах */
    rtpackCssModuleNames: string[];
    rtpackJsModuleNames: string[];
    /** Ссылки подключенных ресурсов */
    scripts: IScriptsAttrsHTML[];
    links: ILinksAttrsHTML[];
}

/**
 * В будущем этот компонент перейдет в разряд устаревших.
 * Настоятельно рекомендуется использовать
 * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/controls/controls-application/ базовые шаблоны веб-страницы}
 * @public
 */
class HTML extends Control<IHTMLCombinedOptions> {
    // tslint:disable-next-line:ban-ts-ignore
    // @ts-ignore
    _template: Function = template;

    private _bodyClasses: string = '__htmlBodyClasses';
    private onServer: Boolean = false;
    // tslint:disable-next-line:ban-ts-ignore
    // @ts-ignore
    private isCompatible: Boolean = false;
    private compat: Boolean = false;
    private RUMEnabled: Boolean = false;
    private pageName: string = '';

    private metaStack: IMetaStackInternal;
    // tslint:disable-next-line:no-any
    private templateConfig: any = null;
    private buildnumber: string = '';
    private appRoot: string = '';
    private staticDomains: string = '[]';
    private wsRoot: string = '';
    private resourceRoot: string = '';
    private servicesPath: string = '';
    private application: string = '';
    private product: string = '';
    private reactApp: Boolean = false;

    // tslint:disable-next-line:ban-ts-ignore
    // @ts-ignore
    // tslint:disable-next-line:no-any
    private linkResolver: any = null;
    // tslint:disable-next-line:ban-ts-ignore
    // @ts-ignore
    private getResourceUrl: Function = getResourceUrl;

    // tslint:disable-next-line:no-any
    private initState(cfg: any): void {
        this.templateConfig = cfg.templateConfig;
        this.compat = cfg.compat || false;
        this._bodyClasses = cfg.bodyClasses || this._bodyClasses;
    }

    private isFocusNode(node: Element): boolean {
        return node.className === 'vdom-focus-in' || node.className === 'vdom-focus-out';
    }

    private markForeignContent(): void {
        if (this.onServer) {
            return;
        }
        const bodyChildren: HTMLCollection = document.body.children;
        for (let i = 0; i < bodyChildren.length; i++) {
            if (bodyChildren[i].id !== 'wasaby-content' && !this.isFocusNode(bodyChildren[i])) {
                bodyChildren[i].setAttribute('data-vdomignore', 'true');
            }
        }
        const htmlChildren: HTMLCollection = document.documentElement.children;
        for (let i = 0; i < htmlChildren.length; i++) {
            if (htmlChildren[i] !== document.head && htmlChildren[i] !== document.body) {
                htmlChildren[i].setAttribute('data-vdomignore', 'true');
            }
        }
    }

    /**
     * @mixes UI/_base/HTML/IHTML
     * @mixes UI/_base/HTML/IRootTemplate
     */

    // tslint:disable-next-line:no-any
    _beforeMount(cfg: IHTMLCombinedOptions, context: any, receivedState: any): Promise<any> {
        this.onServer = typeof window === 'undefined';
        this.isCompatible = cfg.compat;
        this.initState(receivedState || cfg);
        this.metaStack = MetaStack.restore(receivedState?.metaStackSer);
        if (!this.metaStack) {
            this.metaStack = MetaStack.getInstance();
            this.metaStack.push({ title: cfg.title });
        }
        const appData = AppData.getAppData();

        this.markForeignContent();

        this.buildnumber = cfg.buildnumber || constants.buildnumber;

        this.appRoot = cfg.appRoot || appData.appRoot || (cfg.builder ? '/' : constants.appRoot);

        this.RUMEnabled = cfg.RUMEnabled || appData.RUMEnabled || false;
        this.pageName = cfg.pageName || appData.pageName || '';

        // tslint:disable-next-line:ban-ts-ignore
        // @ts-ignore
        this.staticDomains = cfg.staticDomains || appData.staticDomains || constants.staticDomains || '[]';
        if (typeof this.staticDomains !== 'string') {
            this.staticDomains = '[]';
        }

        this.resourceRoot = cfg.resourceRoot || constants.resourceRoot;
        this.product = cfg.product || appData.product || constants.product;
        this.wsRoot = cfg.wsRoot || appData.wsRoot || constants.wsRoot;
        this.reactApp = cfg.reactApp || false;

        // TODO нужно удалить после решения
        // https://online.sbis.ru/opendoc.html?guid=a9ceff55-1c8b-4238-90a7-22dde0e1bdbe
        this.servicesPath =
            cfg.servicesPath || appData.servicesPath || constants.defaultServiceUrl || '/service/';
        this.application = appData.application;

        this.linkResolver = new LinkResolver(
            headDataStore.read('pageDeps').isDebug,
            this.buildnumber,
            this.wsRoot,
            this.appRoot,
            this.resourceRoot
        );

        // LinkResolver.getInstance().init(context.headData.isDebug, self.buildnumber, self.appRoot, self.resourceRoot);

        headDataStore.read('pushDepComponent')(this.application, false);
        /** Список require-зависимостей, уже подключенных в rt-пакетах */
        const unpackDeps = cfg.rtpackJsModuleNames.concat(cfg.rtpackCssModuleNames);
        headDataStore.read('setUnpackDeps')(unpackDeps);
        headDataStore.read('setIncludedResources')({
            links: cfg.links.filter((obj) => obj.type === 'text/css'),
            scripts: cfg.scripts
        });
        /**
         * Этот перфоманс нужен, для сохранения состояния с сервера, то есть,
         * cfg - это конфиг, который нам прийдет из файла роутинга и с ним же надо
         * восстанавливаться на клиенте.
         */
        // Не будем возвращать промис в билдере, потому что там используется GeneratorCompatible
        // Он вставляет конфиги сразу после контрола, а не через StateReceiver. По-другому сейчас не сделать, т.к.
        // функция generatorCompatible решает, какой генератор вернуть? только по константам, а не по аргументам.
        // https://git.sbis.ru/sbis/ws/blob/rc-20.1000/View/Executor/TClosure.ts#L296
        if (receivedState || cfg.builder || cfg.builderCompatible) {
            return;
        }
        return new Promise((resolve) => {
            this._bodyClasses = `${this._bodyClasses} ${AppBody.getInstance().getClassString()}`;
            resolve({
                bodyClasses: this._bodyClasses,
                buildnumber: this.buildnumber,
                metaStackSer: this.metaStack.serialize(),
                appRoot: this.appRoot,
                staticDomains: this.staticDomains,
                RUMEnabled: this.RUMEnabled,
                pageName: this.pageName,
                wsRoot: this.wsRoot,
                resourceRoot: this.resourceRoot,
                templateConfig: this.templateConfig,
                servicesPath: this.servicesPath,
                compat: this.compat,
                product: this.product,
                reactApp: this.reactApp
            });
        });
    }

    _beforeUpdate(options: IHTMLCombinedOptions): void {
        this.markForeignContent();
        if (options.title !== this._options.title) {
            const prevState = this.metaStack.lastState;
            this.metaStack.push({ title: options.title });
            this.metaStack.remove(prevState);
        }
    }
    _afterMount(): void {
        mountChecker.stop();
        function inIframe(): boolean {
            try {
                return window.self !== window.top;
            } catch (e) {
                // Browsers can block access to window.top due to same origin policy.
                return true;
            }
        }

        // We don't know how UI/Base:HTML should behave inside iframe,
        // because we don't know what tasks UI/Base:HTML must solve inside of the iframe
        // You should activate UI/Base:HTML manually(by calling activate() method, for example) if you need it
        if (!detection.isMobilePlatform && !inIframe()) {
            this.activate();
        }
    }

    // tslint:disable-next-line:no-any
    static contextTypes(): { AppData: any } {
        return {
            AppData
        };
    }

    // tslint:disable-next-line:typedef
    static getDefaultOptions() {
        return {
            rtpackJsModuleNames: [],
            rtpackCssModuleNames: [],
            links: [],
            scripts: []
        };
    }
}

Object.defineProperty(HTML, 'defaultProps', {
   enumerable: true,
   configurable: true,

   get(): object {
      return HTML.getDefaultOptions();
   }
});

export default HTML;
