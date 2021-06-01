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
import { convertAttributes, WasabyAttributes } from './Attributes';
import { IWasabyEvent } from 'UICommon/Events';
import { setEventHook } from 'UICore/Events';

import { Control, TemplateFunction } from 'UICore/Base';
import { IControlOptions } from 'UICommon/Base';
import { IGeneratorAttrs, TemplateOrigin, IControlConfig, AttrToDecorate } from './interfaces';
import { Generator } from '../Generator';

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

export class GeneratorVdom extends Generator implements IGenerator {
    prepareDataForCreate(tplOrigin: TemplateOrigin,
        scope: IControlOptions,
        attrs: IGeneratorAttrs,
        deps: Common.Deps<typeof Control, TemplateFunction>,
        includedTemplates?: Common.IncludedTemplates<TemplateFunction>): IControlOptions {
        // scope может прийти после обработки метода uniteScope в шаблоне - это функция reshaper
        // которую надо выполнить чтобы получить результирующий scope
        const controlProperties = Scope.calculateScope(scope, Common.plainMerge) || {};
        if (tplOrigin === '_$inline_template') {
            // в случае ws:template отдаем текущие свойства
            return controlProperties;
        }
        return undefined;
    }

    protected calculateOptions(
        resolvedOptionsExtended: IControlOptions & { ref: React.RefCallback<Control> },
        config: IControlConfig,
        events: Record<string, IWasabyEvent[]>,
        name: string,
        originRef: React.MutableRefObject<Control> | React.LegacyRef<Control>
    ): IControlOptions & { ref: React.RefCallback<Control> } {

        const refs: (React.MutableRefObject<Control> | React.LegacyRef<Control>)[] = [
            createChildrenRef<Control>(config.viewController, name),
            createAsyncRef(config.viewController)
        ];
        if (originRef) {
            refs.push(originRef);
        }
        const ref = mergeRefs(refs);

        return {
            ...resolvedOptionsExtended,
            ...{ events },
            ref
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
     * Получает конструктор контрола по его названию и создаёт его с переданными опциями.
     * @param origin Либо сам шаблон/конструктор контрола, либо строка, по которой его можно получить.
     * @param scope Опции контрола.
     * @param _
     * @param __
     * @param deps Объект с зависимостями контрола, в нём должно быть поле, соответствующее name.
     */
    createWsControl(
        origin: string | typeof Control,
        scope: IControlOptions,
        decorAttribs: IGeneratorAttrs,
        __: unknown,
        deps: Common.Deps<typeof Control, TemplateFunction>
    ): React.ComponentElement<
        IControlOptions,
        Control<IControlOptions, object>
    > {
        return this.createReactControl(origin, scope, decorAttribs, __, deps);
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
     * @param _
     * @param __
     * @param control Инстанс контрола-родителя, используется для заполнения _children.
     */
    createTag<T extends HTMLElement, P extends React.HTMLAttributes<T>>(
        tagName: keyof React.ReactHTML,
        attrs: {
            attributes: P &
            WasabyAttributes & {
                name?: string;
                ref?: React.MutableRefObject<HTMLElement> | React.LegacyRef<HTMLElement>
            };
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
        const mergedAttrs = Attr.mergeAttrs(attrToDecorate.attributes, attrs.attributes);
        Object.keys(mergedAttrs).forEach((attrName) => {
            if (!mergedAttrs[attrName]) {
                delete mergedAttrs[attrName];
            }
        });
        const name = mergedAttrs.name;
        const originRef = attrs.attributes.ref;
        const refs: (React.MutableRefObject<HTMLElement> | React.LegacyRef<HTMLElement>)[] = [
            createEventRef(tagName, eventsObject),
            createChildrenRef(control, name)
        ];
        if (originRef) {
            refs.push(originRef);
        }
        const ref = mergeRefs(refs);

        const convertedAttributes = convertAttributes(mergedAttrs);

        /* не добавляем extractedEvents в новые пропсы на теге, т.к. реакт будет выводить ошибку о неизвестном свойстве
            https://online.sbis.ru/opendoc.html?guid=d90ec578-f610-4d93-acdd-656095591bc1
        */
        const newProps = {
            ...convertedAttributes,
            ref
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
): React.RefCallback<HTMLElement> {
    return (node) => {
        if (node && Object.keys(eventsObject.events).length > 0) {
            setEventHook(tagName, eventsObject, node);
        }
    };
}

function createChildrenRef<T>(
    parent: Control,
    name: string
): React.RefCallback<T> {
    if (!parent || !name) {
        return;
    }

    return (node) => {
        if (node) {
            parent['_children'][name] = node;
            onElementMount(parent['_children'][name]);
        } else {
            onElementUnmount(parent['_children'], name);
        }
    };
    /* tslint:enable:no-string-literal */
}
function createAsyncRef(
    parent: Control
): React.RefCallback<Control> {
    if (!parent) {
        return;
    }

    return (control) => {
        if (!control) {
            return;
        }
        const afterMountPromise = new Promise((resolve) => {
            control._$afterMountResolve.push(resolve);
        });
        parent._$childrenPromises?.push(afterMountPromise);
    };
}
