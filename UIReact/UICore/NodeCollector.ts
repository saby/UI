// TODO: отказаться от использований и удалить.
// Не получилось указать возвращение unknown[], в точках использования падают ошибки типа
// "error TS2339: Property '_$defaultActions' does not exist on type 'unknown'".
export function goUpByControlTree(arg: unknown): any[] {
    throw new Error('Метод goUpByControlTree не реализован в системе Реакта');
}
