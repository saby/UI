/// <amd-module name="UI/_base/_meta/ResourceMeta"/>
import { IMeta, IMetaState, IMetaStack } from 'UI/_base/_meta/interface';
import { default as Stack } from 'UI/_base/_meta/Stack';
import { IResourceDisposable } from 'Application/State';

const getMetaStack: () => IMetaStack = Stack.getInstance;
/**
 * Класс-Ресурс, который отвечает за обновление, удаление метаданных
 * @class UI/_base/_meta/ResourceMeta
 * @implements Application/_State/IResourceDisposable
 * @public
 * @author Хамбелов М.И.
 */
export class ResourceMeta implements IResourceDisposable {
    private _metaState: IMetaState;
    constructor(private meta: IMeta) {}
    enter(): void {
        this._metaState = getMetaStack().push(this.meta);
    }
    dispose(): void {
        getMetaStack().remove(this._metaState);
    }
}


