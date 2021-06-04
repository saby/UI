import * as React from 'react';
import { Logger, ArrayUtils } from 'UICommon/Utils';
import {
    CommonUtils as Common,
    onElementMount,
    onElementUnmount,
    IGenerator,
    Attr,
    Scope
} from 'UICommon/Executor';
import { convertAttributes, WasabyAttributes } from '../Attributes';
import { IWasabyEvent } from 'UICommon/Events';
import { setEventHook } from 'UICore/Events';

import { Control } from 'UICore/Base';
import { IControlOptions } from 'UICommon/Base';
import { TemplateOrigin, IControlConfig, AttrToDecorate } from '../interfaces';
import { Generator } from '../Generator';

import { Responsibility, IResponsibilityHandler, ChainOfRef } from 'UICore/Ref';

function mergeRefs<T>(refs: (React.MutableRefObject<T> | React.LegacyRef<T>)[]): React.RefCallback<T> {
    return value => {
        refs.forEach(ref => {
            if (typeof ref === 'function') {
                ref(value);
            } else if (typeof ref === 'string') {
                Logger.warn('Although string refs are not deprecated, they are considered legacy,' +
                    ' and will likely be deprecated at some point in the future. Callback refs are preferred.');
            } else if (ref !== null && ref !== undefined) {
                // @ts-ignore на самом деле current меняется
                ref.current = value;
            }
        });
    };
}

class CreateEventRef extends Responsibility {
    private tagName: string;
    private eventsObject: {
        events: Record<string, IWasabyEvent[]>;
    };
    constructor(tagName, eventsObject) {
        super();
        this.tagName = tagName;
        this.eventsObject = eventsObject;

    }
    public getHandler(): IResponsibilityHandler {
        return (node: HTMLElement): void => {
            if (node && Object.keys(this.eventsObject.events).length > 0) {
                setEventHook(this.tagName, this.eventsObject, node);
            }
        };
    }
}

class CreateChildrenRef extends Responsibility {
    private parent: Control;
    private name: string;

    constructor(parent: Control, name: string) {
        super();
        this.name = name;
        this.parent = parent;

    }
    public getHandler(): IResponsibilityHandler {
        return (node: HTMLElement) => {
            if (!node) {
                onElementUnmount(this.parent['_children'], this.name);
                return;
            }
            this.parent['_children'][this.name] = node;
            onElementMount(this.parent['_children'][this.name]);
        };
    }
}

class CreateAsyncRef extends Responsibility {
    private parent: Control;

    constructor(parent: Control) {
        super();
        this.parent = parent;

    }
    public getHandler(): IResponsibilityHandler {
        if (!parent) {
            return () => {};
        }
        return (control) => {
            if (!control) {
                return;
            }
            const afterMountPromise = new Promise((resolve) => {
                control._$afterMountResolve.push(resolve);
            });
            this.parent._$childrenPromises?.push(afterMountPromise);
        };
    }
}

export class GeneratorVdom extends Generator implements IGenerator {
    /**
     * подготавливает опции для контрола. вызывается в функции шаблона в случае выполнения инлайн шаблона
     * @param tplOrigin тип шаблона
     * @param scope результирующий контекст выполнения
     */
    prepareDataForCreate(tplOrigin: TemplateOrigin, scope: IControlOptions): IControlOptions {
        // scope может прийти после обработки метода uniteScope в шаблоне - это функция reshaper
        // которую надо выполнить чтобы получить результирующий scope
        const controlProperties = Scope.calculateScope(scope, Common.plainMerge) || {};
        if (tplOrigin === '_$inline_template') {
            // в случае ws:template отдаем текущие свойства
            return controlProperties;
        }
        return undefined;
    }

    createDirective(text: any): any {
        try {
            throw new Error('vdomMarkupGenerator createDirective not realized');
        } catch (e) {
            Logger.error('createDirective  ... in VDom', text, e);
        }
    }

    protected calculateOptions(
        resolvedOptionsExtended: IControlOptions & { ref: React.RefCallback<Control> },
        config: IControlConfig,
        events: Record<string, IWasabyEvent[]>,
        name: string,
        originRef: React.MutableRefObject<Control> | React.LegacyRef<Control>
    ): IControlOptions & { ref: React.RefCallback<Control> } {
        const chainOfRef = new ChainOfRef();
        chainOfRef.add(createChildrenRef(config.viewController, name));
        chainOfRef.add(createAsyncRef(config.viewController));

        return {
            ...resolvedOptionsExtended,
            ...{ events },
            ref: chainOfRef.execute()
        };
    }

    /*
    FIXME: не понимаю зачем нужен этот метод, по сути он ничего не делает.
    Вроде шаблонизатор не может сгенерировать вызов этого метода с чем-то отличным от строки.
     */
    createText(text: string): string {
        if (typeof text !== 'string') {
            /*
            FIXME: я считаю, что эта функция всегда зовётся со строкой и проверка бесполезна.
            Но т.к. она тут была, то удалять её немножко страшно, вдруг там реально были не вызовы не со строками.
            Ведь для реакта null и undefined это валидные ноды, но странно, если для них звался бы createText.
             */
            Logger.error(
                'Тут должна была прийти строка, нужно подняться по стеку и понять откуда здесь что-то другое'
            );
            return '';
        }
        return text;
    }

    /**
     * Дает возможность дополнительно трансформировать результат построения контрола.
     * @param control Результат построения контрола.
     */
    processControl(
        control: React.ComponentElement<
            IControlOptions,
            Control<IControlOptions, object>
            >
    ): React.ComponentElement<
        IControlOptions,
        Control<IControlOptions, object>
    > {
        return control;
    }

    /*
    FIXME: Изначально в joinElements было return ArrayUtils.flatten(elements, true).
    Он зовётся из каждого шаблона, так что нельзя просто взять и удалить.
    Вроде он нужен для тех случаев, когда partial вернёт вложенный массив. Я пытался возвращать
    несколько корневых нод из partial, возвращался просто массив из двух элементов.
    Так что пока этот метод ничего не делает.
     */
    joinElements(elements: React.ReactNode): React.ReactNode {
        if (Array.isArray(elements)) {
            return ArrayUtils.flatten(elements, true, true);
        } else {
            throw new Error('joinElements: elements is not array');
        }
    }

    /**
     * Строит DOM-элемент.
     * @param tagName Название DOM-элемента.
     * @param attrs Атрибуты DOM-элемента.
     * @param children Дети DOM-элемента.
     * @param attrToDecorate атрибуты элемента.
     * @param __
     * @param control Инстанс контрола-родителя, используется для заполнения _children.
     */
    createTag<T extends HTMLElement, P extends React.HTMLAttributes<T>>(
        tagName: keyof React.ReactHTML,
        attrs: {
            attributes: P & WasabyAttributes;
            events: Record<string, IWasabyEvent[]>
        },
        children: React.ReactNode[],
        attrToDecorate: AttrToDecorate,
        __: unknown,
        control?: Control
    ): React.DetailedReactHTMLElement<P, T> {
        if (!attrToDecorate) {
            attrToDecorate = {attributes: {}, events: {}};
        }
        /* если события объявляется на контроле, и корневом элементе шаблона, то мы должны смержить события,
         * без этого события объявленные на контроле будут потеряны
         */
        const extractedEvents = { ...attrToDecorate.events, ...attrs.events };
        const eventsObject = {
            events: extractedEvents
        };
        /**
         * Объединяет атрибуты, указанные на элементе, с атрибутами, которые пришли сверху
         */
        const mergedAttrs = Attr.mergeAttrs(attrToDecorate.attributes, attrs.attributes);
        Object.keys(mergedAttrs).forEach((attrName) => {
            if (!mergedAttrs[attrName]) {
                delete mergedAttrs[attrName];
            }
        });
        const name = mergedAttrs.name;
        const chainOfRef = new ChainOfRef();
        chainOfRef.add(createChildrenRef(control, name));
        chainOfRef.add(createEventRef(tagName, eventsObject));
        const convertedAttributes = convertAttributes(mergedAttrs);

        /* не добавляем extractedEvents в новые пропсы на теге, т.к. реакт будет выводить ошибку о неизвестном свойстве
            https://online.sbis.ru/opendoc.html?guid=d90ec578-f610-4d93-acdd-656095591bc1
        */
        const newProps = {
            ...convertedAttributes,
            ref: chainOfRef.execute()
        };

        // Разворачиваем массив с детьми, так как в противном случае react считает, что мы отрисовываем список
        return React.createElement<P, T>(tagName, newProps, ...ArrayUtils.flatten(children, true));
    }

    // FIXME: бесполезный метод, но он зовётся из шаблонов
    escape<T>(value: T): T {
        return value;
    }
}

function createEventRef<HTMLElement>(
    tagName: string,
    eventsObject: {
        events: Record<string, IWasabyEvent[]>;
    }
): CreateEventRef {
    return new CreateEventRef(tagName, eventsObject);
}

function createChildrenRef<T>(
    parent: Control,
    name: string
): CreateChildrenRef {
    return new CreateChildrenRef(parent, name);
}

function createAsyncRef(
    parent: Control
): CreateAsyncRef {
    return new CreateAsyncRef(parent);
}



