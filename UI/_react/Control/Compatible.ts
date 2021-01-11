import {Component, createElement, ReactElement} from 'react';
import { IControlOptions, ITemplateFunction } from './interfaces';
import {reactiveObserve} from './ReactiveObserver';
import {_IGeneratorType} from "UI/Executor";
import {getGeneratorConfig} from "UI/Base";

interface IControlState {
    loading: boolean;
}

let countInst = 1;

export type TemplateFunction = (data: any, attr?: any, context?: any, isVdom?: boolean, sets?: any,
                                forceCompatible?: boolean, generatorConfig?: _IGeneratorType.IGeneratorConfig) => string;

/**
 * Базовый контрол, наследник React.Component с поддержкой совместимости с Wasaby
 * @class UI/ReactComponent/Control
 * @author Mogilevsky Ivan
 * @public
 */
export class Control<P extends IControlOptions = {}, T = {}> extends Component<P, IControlState> {
    private _firstRender: boolean = true;
    private _asyncMount: boolean = false;
    private _$observer: Function = reactiveObserve;
    protected _template: ITemplateFunction;
    protected _options: P;

    private readonly _instId: string = 'inst_' + countInst++;

    constructor(props: P) {
        super(props);
        this._options = props;
        this.state = {
            loading: true
        };
    }

    getInstanceId(): string {
        return this._instId;
    }

    _notify(): void {
        // nothing for a while...
    }

    /* Start: Compatible lifecicle hooks */

    /**
     * Хук жизненного цикла контрола. Вызывается непосредственно перед установкой контрола в DOM-окружение.
     * @param {Object} options Опции контрола.
     * @param {Object} contexts Поля контекста, запрошенные контролом.
     * @param {Object} receivedState Данные, полученные посредством серверного рендеринга.
     * @remark
     * Первый хук жизненного цикла контрола и единственный хук, который вызывается как на стороне сервера, так и на стороне клиента.
     * Он вызывается до рендеринга шаблона, поэтому обычно используется для подготовки данных для шаблона.
     * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/control/#life-cycle-phases
     */
    protected _beforeMount(options?: P, contexts?: object, receivedState?: T): Promise<T | void> | void {
        // Do
    }

    private __beforeMount(): void {
        const beforeMountResult = this._beforeMount(this.props);
        if (beforeMountResult && beforeMountResult.then) {
            this._asyncMount = true;
            beforeMountResult.then(() => {
                this._firstRender = false;
                this.setState({
                    loading: false
                }, () => this._afterMount(this.props));
            });
        } else {
            this._firstRender = false;
        }
        // TODO: Вынести работу с reactiveProps в генераторы
        if (this._template.reactiveProps) {
            this._$observer(this, this._template.reactiveProps);
        }
    }

    // На данном этапе рисуем индикатор вместо компонента в момен загрузки асинхронного beforeMount
    private _getLoadingComponent(): ReactElement {
        return createElement('img', {
            src: '/cdn/LoaderIndicator/1.0.0/ajax-loader-indicator.gif'
        });
    }

    /**
     * Хук жизненного цикла контрола. Вызывается сразу после установки контрола в DOM-окружение.
     * @param {Object} options Опции контрола.
     * @param {Object} context Поле контекста, запрошенное контролом.
     * @remark
     * Первый хук жизненного цикла контрола, который вызывается после подключения контрола к DOM-окружению.
     * На этом этапе вы можете получить доступ к параметрам и контексту this._options.
     * Этот хук жизненного цикла часто используется для доступа к DOM-элементам и подписки на события сервера.
     * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/control/#life-cycle-phases
     */
    protected _afterMount(options?: P, context?: object): void {
        // Do
    }

    /**
     * Хук жизненного цикла контрола. Вызывается перед обновлением контрола.
     *
     * @param {Object} newOptions Опции, полученные контролом. Устаревшие опции можно найти в this._options.
     * @param {Object} newContext Контекст, полученный контролом. Устаревшие контексты можно найти в this._context.
     * @remark В этом хуке вы можете сравнить новые и старые опции и обновить состояние контрола.
     * В этом хуке, также, вы можете подготовить все необходимое для визуализации шаблона контрола. Часто код в этом блоке схож с кодом в хуке _beforeMount.
     * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/control/#life-cycle-phases
     */
    protected _beforeUpdate(newOptions?: P, newContext?: object): void {
        // Do
    }

    /**
     * Хук жизненного цикла контрола. Вызывается после обновления контрола.
     *
     * @param {Object} oldOptions Опции контрола до обновления контрола.
     * @param {Object} oldContext Поля контекста до обновления контрола.
     * @protected
     */
    protected _afterUpdate(oldOptions?: P, oldContext?: object): void {
        // Do
    }

    /**
     * Хук жизненного цикла контрола. Вызывается до удаления контрола.
     * @remark Это последний хук жизненного цикла контрола. Контрол не будет существовать после вызова этого хука.
     * Его можно использовать для отмены подписки на события сервера и очистки всего, что было сохранено в памяти.
     * @see https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/control/#life-cycle-phases
     */
    protected _beforeUnmount(): void {
        // Do
    }

    /* End: Compatible lifecicle hooks */

    /* Start: React lifecicle hooks */

    componentDidMount(): void {
        if (!this._asyncMount) {
            this._afterMount.apply(this);
        }
    }

    componentDidUpdate(prevProps: P): void {
        this._options = this.props;
        this._afterUpdate.apply(this, [prevProps]);
    }

    getSnapshotBeforeUpdate(): void {
        if (!this._firstRender) {
            this._beforeUpdate.apply(this, [this.props]);
        }
        return null;
    }

    componentWillUnmount(): void {
        this._beforeUnmount.apply(this);
    }

    saveInheritOptions(): any {

    }
    _saveContextObject(): any {

    }
    saveFullContext(): any {

    }

    render(): unknown {
        if (this._firstRender) {
            this.__beforeMount();
        }

        if (this._asyncMount && this.state.loading) {
            return this._getLoadingComponent();
        }

        const generatorConfig = getGeneratorConfig();
        //@ts-ignore
        window.reactGenerator = true;
        const ctx = {...this, _options: {...this.props}};
        //@ts-ignore
        const res = this._template(ctx, {}, undefined, undefined, undefined, undefined, generatorConfig);
        //@ts-ignore
        window.reactGenerator = false;
        return res;
    }
}
