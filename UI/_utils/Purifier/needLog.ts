import { constants } from 'Env/Env';

// @ts-ignore
const isNotProduction = !constants.isProduction;

export default function needLog(): boolean {
    return isNotProduction;
}
