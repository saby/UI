type TPauseReactive = (_: any, func: Function) => void;

export let pauseReactive: TPauseReactive = (_: any, func: Function) => {
    func();
};

export function setPauseReactive(newPauseReactive: TPauseReactive): void {
    pauseReactive = newPauseReactive;
}
