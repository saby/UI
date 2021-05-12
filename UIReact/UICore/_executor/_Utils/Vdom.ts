/// <amd-module name="UICore/_executor/_Utils/Vdom" />

/**
 * @author Тэн В.А.
 */

export function htmlNode(
    tagName: unknown,
    hprops: unknown,
    children: unknown,
    key: unknown,
    ref?: unknown
): unknown {
    throw new Error('В сборке на Реакте нет метода htmlNode, следует удалить его использования');
}

export function textNode(text: unknown, key?: unknown): unknown {
    throw new Error('В сборке на Реакте нет метода htmlNode, следует удалить его использования');
}

export function controlNode(controlClass: unknown, controlProperties: unknown, key: unknown): unknown {
    throw new Error('В сборке на Реакте нет метода controlNode, следует удалить его использования');
}
