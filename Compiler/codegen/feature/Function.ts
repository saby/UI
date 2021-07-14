
const WASABY_TEMPLATE_PARAMETERS = [
   'data',
   'attr',
   'context',
   'isVdom',
   'sets',
   'forceCompatible',
   'generatorConfig'
];

const EMPTY_STRING = '';

function replaceAnonymousFunctionName(name: string, text: string): string {
   return text.replace('function anonymous', `function ${name}`);
}

export function createTemplateFunction(body: string): Function {
   const params = WASABY_TEMPLATE_PARAMETERS.join(', ');
   return new Function(params, body);
}

export function createTemplateFunctionString(body: string, name: string = EMPTY_STRING): string {
   const text = createTemplateFunction(body).toString();
   return replaceAnonymousFunctionName(name, text);
}

export function generateTemplateFunctionCall(name: string, args: string[]): string {
   const params = args.join(', ');
   return `${name}.call(${params})`;
}