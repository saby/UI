/**
 * выключаем режим совместимости для "новых" старых страниц - WS3Page/MasterPage, которые строятся на базе wml!UI/Route
 */
try {
    process.domain.req.compatible = false;
    // tslint:disable-next-line:no-empty
} catch (e) {}

export = {};
