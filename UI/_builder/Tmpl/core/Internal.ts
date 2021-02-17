
const USE_INTERNAL_MECHANISM = false;

export function canUseNewInternalMechanism(): boolean {
    return USE_INTERNAL_MECHANISM;
}

export function process(...args: any[]): any {
    throw new Error('Not implemented yet');
}