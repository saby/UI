import {constants} from 'Env/Env';
import {Control} from 'UI/Base';
import {Logger} from 'UICommon/Utils';
import {IControlObj} from './_base/Refs/Controls';
import {IControl} from 'UICommon/interfaces';

export interface IWrapHTMLElement extends Node {
    jquery?: unknown;
    wsControl?: string;
    _$controls?: IControlObj[];
}

export function goUpByControlTree(target: IWrapHTMLElement, array?: Control[]): Control[] {
    const controlTree = array || [];
    const element = target?.jquery ? target[0] : target;
    if (element) {
        if (element._$controls && element._$controls.length) {
            addControlsToFlatArray(element._$controls[0], controlTree);
        } else if (constants.compat && element.wsControl) {
            // Если встретили старый компонент, нужно собирать его парентов по старому API
            addControlsToFlatArrayOld(element.wsControl, controlTree);
        } else {
            // Рекурсивно поднимаемся вверх по элементам, пока не сможем вычислить ближайший компонент
            goUpByControlTree(element.parentNode, controlTree);
        }
    }
    return controlTree;
}
export function getClosestControl(element: HTMLElement): IControl {
    return goUpByControlTree(element)[0];
}

/**
 * Вычисляет controlNode для control
 * @param control
 * @returns {*}
 */
function getControlObj(control: Control): IControlObj {
    // @ts-ignore _container сейчас protected
    const controls = control._container._$controls;
    for (const i in controls) {
        if (controls.hasOwnProperty(i)) {
            if (controls[i].control === control) {
                return controls[i];
            }
        }
    }
}

function checkOpener(opener: Control): void {
    let error;

    if (opener) {
        // Component instance must have _options
        // @ts-ignore _options -> protected
        if (opener && !opener._options) {
            // @ts-ignore getName -> protected
            const name = opener.getName ? opener.getName() : '[not detected]';
            // @ts-ignore _moduleName -> protected
            error = `Control ${opener._moduleName} with name ${name} must have _options`;
        }
    }

    if (error) {
        const message = `[UICore/_nodeCollector/goUpByControlTree:checkOpener] DOMEnvironment - Incorrect opener or parent is found! It seems that anybody set wrong opener option! ${error}`;
        Logger.error(message, opener);
    }
}

/**
 * Focus parent is a component that contains the given control
 * "logically" and receives the focus whenever the given control
 * is focused.
 * @param control Control to get the focus parent for
 * @returns Focus parent of the given control
 */
function getFocusParent(control: Control): Control | null {
    // ищем предка текущего контрола, сначала смотрим есть ли opener, если нет - берем parent
    // @ts-ignore _options, getOpener -> protected
    const result = control?._options?.opener || control?.getOpener?.() || control?._options?.parent
        // @ts-ignore getParent -> protected
        || control?.getParent?.();
    if (!result || result.__purified) {
        return null;
    } else {
        return result;
    }
}

/**
 * Recursively collect array of openers or parents
 * @param controlObj
 * @param array
 */
function addControlsToFlatArray(controlObj: IControlObj, array: Control[]): void {
    const control = controlObj.control;
    if (array[array.length - 1] !== control) {
        array.push(control);
    }

    // В React ref строится снизу вверх, поэтому на момент построения мы не можем указать дочерним компонентам их
    // родителей, отсюда данный код по составлению массива родительских компонентов
    // @ts-ignore _container protected
    let parent = control._container?.parentNode as IWrapHTMLElement;
    let inProgress = true;

    while (parent && inProgress) {
        if (parent._$controls) {
            inProgress = false;
        } else {
            parent = parent?.parentNode;
        }
    }

    // Поднимаемся по controlNode'ам, потому что у control'а нет доступа к родительскому контролу
    // @ts-ignore _options -> protected
    let next = control._options.opener || parent?._$controls[0];
    if (next && next._destroyed) {
        return;
    }
    if (next && !next.control) {
        if (next._container) {
            checkOpener(next);
            next = getControlObj(next);
        } else {
            // если компонент невизуальный, ничего не ищем
            next = null;
        }
    }
    if (next) {
        addControlsToFlatArray(next, array);
    } else {
        next = getFocusParent(control);
        checkOpener(next);
        // может мы уперлись в кореневой VDOM и надо посмотреть, есть ли на нем wsControl,
        // если есть - начинаем вслпывать по старому
        if (next) {
            addControlsToFlatArrayOld(next, array);
        }
    }
}

function addControlsToFlatArrayOld(control: Control, array: Control[]): void {
    if (array[array.length - 1] !== control) {
        array.push(control);
    }

    const parent = getFocusParent(control);

    checkOpener(parent);

    if (parent) {
        // если найденный компонент является vdom-компонентом, начинаем всплывать по новому
        // @ts-ignore _template & _container -> protected
        if (parent._template && parent._container) {
            // @ts-ignore _container -> protected
            const container = parent._container as IWrapHTMLElement;
            const controls = container?._$controls[0];
            if (controls) {
                addControlsToFlatArray(container._$controls[0], array);
                // @ts-ignore hasCompatible -> protected
            } else if (typeof parent.hasCompatible === 'function' && parent.hasCompatible()) {
                // On old pages it is possible that the vdom component has already been destroyed
                // and its control node was removed from container. If it has compatible layer
                // mixed in, we can still get the parent using old methods
                addControlsToFlatArrayOld(parent, array);
            }
        } else {
            addControlsToFlatArrayOld(parent, array);
        }
    }
}
