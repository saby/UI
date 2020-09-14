/// <amd-module name="UI/_base/HeadController" />

function setTitle(newTitle: string): void {
    if (typeof window !== 'undefined') {
        window.document.title = newTitle;
    }
}

export default {
    setTitle
};
