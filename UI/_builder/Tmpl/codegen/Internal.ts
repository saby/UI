import { canUseNewInternalMechanism } from 'UI/_builder/Tmpl/core/Internal';

const USE_INTERNAL_FUNCTIONS = false;

export function canUseNewInternalFunctions(): boolean {
    return canUseNewInternalMechanism() && USE_INTERNAL_FUNCTIONS;
}

export function generate(...args: any[]): string {
    throw new Error('Not implemented yet');
}