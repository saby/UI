import { getMetaStack, IMeta, IMetaState } from 'UI/_base/HTML/meta';


/**
 * Интерфейс ресурса
 */
interface IOwnedDisposable {
    enter(owner: unknown): void;
    dispose(owner: unknown): void;
}
/**
 * Класс-Ресурс, который отвечает за обновление, удаление метаданных
 */
export class ResourceMeta implements IOwnedDisposable {
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


