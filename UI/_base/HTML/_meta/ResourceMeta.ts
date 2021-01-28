/// <amd-module name="UI/_base/HTML/_meta/ResourceMeta" />
import { IMeta, IMetaState, IMetaStack } from 'UI/_base/HTML/_meta/interface';
import { default as Stack } from 'UI/_base/HTML/_meta/Stack';

/**
 * Интерфейс ресурса
 */
interface IResourceDisposable {
    enter(owner: unknown): void;
    dispose(owner: unknown): void;
}

const getMetaStack: () => IMetaStack = Stack.getInstance;
/**
 * Класс-Ресурс, который отвечает за обновление, удаление метаданных
 */
export class ResourceMeta implements IResourceDisposable {
    private _metaState: IMetaState;
    constructor(private meta: IMeta) {
    }
    enter(): void {
        this._metaState = getMetaStack().push(this.meta);
    }
    dispose(): void {
        getMetaStack().remove(this._metaState);
    }
}


