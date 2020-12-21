import {Component, createElement, ReactElement, FunctionComponent} from 'react';

/**
 * TODO: Список задача
 * 1. Контексты для опций (theme и readonly)
 * 2. Объявить болванки для методов _notify, activate
 * 3. Опции по умолчанию
 * 4. Избавиться от any
 * 5. Recieved State
 * 6. reactiveProps навешивается вручную + не проверяет сложные объекты
 */

export interface IControlOptions<C = Control> {
    // Ссылка на инстанс для корректной работы шаблонов
    _$wasabyInstance?: C;
}

interface IControlState {
    loading: boolean;
}

export interface ITemplateFunction<P = IControlOptions, S = {}> extends FunctionComponent<IControlOptions> {
    reactiveProps?: string[];
}

function observe<P = IControlOptions, S = {}>(inst: Control<P, S>, reactiveProps: string[]): void {
    const reactiveValues = {};
    reactiveProps.forEach((prop) => {
        reactiveValues[prop] = inst[prop];
        Object.defineProperty(inst, prop, {
            enumerable: true,
            configurable: true,
            get: function reactiveGetter(): unknown {
                return reactiveValues[prop];
            },
            set: function reactiveSetter(value: unknown): void {
                if (reactiveValues[prop] !== value) {
                    reactiveValues[prop] = value;
                    inst.forceUpdate();
                }
            }
        });
    });
}

/**
 * Базовый контрол, наследник React.Component с поддержкой совместимости с Wasaby
 * @class UIDemo/_react/Control
 * @public
 */
export class Control<P extends IControlOptions = {}, T = {}> extends Component<P, IControlState> {
    private _firstRender: boolean = true;
    private _asyncMount: boolean = false;
    private _$observer: Function = observe;
    protected _template: ITemplateFunction;
    protected _options: P;

    constructor(props: P) {
        super(props);
        this._options = props;
        this.state = {
            loading: true
        };
    }

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
        return undefined;
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
     * @param {Object} oldOptions
     * @param {Object} oldContext
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

    componentDidMount(): void {
        if (!this._asyncMount) {
            this._afterMount.apply(this);
        }
    }

    componentDidUpdate(prevProps: P): void {
        this._options = this.props;
        this._afterUpdate.apply(this, [prevProps]);
    }

    getSnapshotBeforeUpdate(prevProps: P): void {
        if (prevProps !== this.props) {
            this._beforeUpdate.apply(this, [this.props]);
        }
        return null;
    }

    componentWillUnmount(): void {
        this._beforeUnmount.apply(this);
    }

    private _getLoadingComponent(): ReactElement {
        return createElement('img', {
            src: '/cdn/LoaderIndicator/1.0.0/ajax-loader-indicator.gif'
        });
    }

    private __beforeMount(): void {
        this._firstRender = false;
        const beforeMountResult = this._beforeMount(this.props);
        if (beforeMountResult && beforeMountResult.then) {
            this._asyncMount = true;
            beforeMountResult.then(() => {
                this.setState({
                    loading: false
                }, () => this._afterMount(this.props));
            });
        }
        if (this._template.reactiveProps) {
            this._$observer(this, this._template.reactiveProps);
        }
    }

    render(): unknown {
        if (this._firstRender) {
            this.__beforeMount();
        }

        return this._asyncMount && this.state.loading ?
            this._getLoadingComponent() :
            createElement<IControlOptions>(this._template, {_$wasabyInstance: this, ...this.props});
    }
}
