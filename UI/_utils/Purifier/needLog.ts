/**
 * @author Кондаков Р.Н.
 */

const isNotProduction: boolean = isTestDomain();
const isClientSide = typeof window !== 'undefined';

export default function needLog(): boolean {
    return isNotProduction;
}

export function needPurify(): boolean {
    return isClientSide;
}

// Возможно, это должно быть где-то отдельно.
function isTestDomain(): boolean {
    const testPrefixes = [
       'wi.sbis.ru',
       'platform-',
       'dev-',
       'test-',
       'localhost',
       '127.0.0.1',
       'fix-',
       'dev.',
       'test.',
       'fix.',
       'rc-',
       'rc.'
    ];
    const hasTestPreffixRegExp = new RegExp(testPrefixes.join('|'));

    const location = typeof window === 'object' && window.location;

    return !!location && (hasTestPreffixRegExp.test(location.host) || !!location.port);
}
