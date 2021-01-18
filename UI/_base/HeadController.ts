/// <amd-module name="UI/_base/HeadController" />

/**
 * @author Санников К.А.
 */

function setTitle(newTitle: string): void {
    if (typeof window !== 'undefined') {
        window.document.title = newTitle;
    }
}

export default {
    setTitle
};
