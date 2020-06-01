import { constants } from 'Env/Env';

const isNotProduction = !constants.isProduction;

export default function needLog(): boolean {
    return isNotProduction;
}
