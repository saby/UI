import { Control } from 'UICore/Base';
import { Logger } from 'UI/Utils';

/**
 * @author Тэн В.А.
 * Отладка системы событий
 * для включения следует использовать куку - eventSystemDebug=true
 */

const NOTIFY_INTERVAL = 1000;
const DEBUG_HEADER = '[DEBUG] [WasabyEvents]\n';

export class WasabyEventsDebug {
    private static instance: WasabyEventsDebug;
    private static notifyIntervals = {};
    private static notifyIntervalCount = 0;
    public static debugEnable;

    /**
     * Отладка notify
     * позволяет получить список зависших _notify
     * WasabyEventsDebug.debugNotify().getInfo()
     */
    public static debugNotify(inst: Control, errorName: string) {
        function debug(intervalName) {
            let tick = 0;
            const intervalTimer = setInterval((): void => {
                if (inst._container) {
                    inst._container.style.border = '1px dashed #ff9933';
                    clearInterval(intervalTimer);
                    delete WasabyEventsDebug.notifyIntervals[intervalName];
                    return;
                }
                tick += 1;
            }, NOTIFY_INTERVAL);
            return {
                getInfo: () => {
                    Logger.info(
                        DEBUG_HEADER +
                        '\tcontrol name: ' + errorName + '\n' +
                        '\tcontrol mounted: ' + inst._$controlMounted + '\n' +
                        '\tinterval name: ' + intervalName + '\n' +
                        "\ttick count: " + tick)
                }
            }
        }
        function attach(): void {
            if (!WasabyEventsDebug.debugEnable) {
                return;
            }
            const intervalName = 'debug_' + WasabyEventsDebug.notifyIntervalCount;
            WasabyEventsDebug.notifyIntervals[intervalName] = debug(intervalName);
            WasabyEventsDebug.notifyIntervalCount += 1;
        }

        function getIntervalsInfo(): void {
            if (!WasabyEventsDebug.debugEnable) {
                return;
            }
            Object.values(WasabyEventsDebug.notifyIntervals).forEach((inst) => {
                inst.getInfo();
            })
        }
        return {
            attach: attach,
            getInfo: getIntervalsInfo
        }
    }

    public static get(): WasabyEventsDebug {
        if (!WasabyEventsDebug.instance) {
            WasabyEventsDebug.instance = new WasabyEventsDebug();
        }
        return WasabyEventsDebug.instance;
    }
}
