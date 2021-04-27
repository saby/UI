type TPauseReactive = (_: any, func: Function) => void;

export let pauseReactive: TPauseReactive = (_: any, func: Function) => {
    func();
};

// pause reactive используется в UICommon, но задаётся в UICore. А UICommon не зависит от UICore.
// Поскольку в UICommon его переносить не надо, как временную возможность будем его задавать.
export function setPauseReactive(newPauseReactive: TPauseReactive): void {
    pauseReactive = newPauseReactive;
}
