import { IoC } from 'Env/Env';

function logError(tag, err) {
   var logger = IoC.resolve('ILogger') || console;
   logger.error(tag, err.message, err);
}

export {
   logError
}
