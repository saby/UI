import { cookie } from 'Env/Env';

const isDebug = !!cookie.get('s3debug');

export default function needLog(): boolean {
    return isDebug;
}
