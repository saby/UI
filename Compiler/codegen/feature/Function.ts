
const WASABY_TEMPLATE_PARAMETERS = [
   'data',
   'attr',
   'context',
   'isVdom',
   'sets',
   'forceCompatible',
   'generatorConfig'
];

function replaceAnonymousFunctionName(name: string, text: string): string {
   return text.replace('function anonymous', `function ${name}`);
}

export function createTemplateFunction(body: string): Function {
   const params = WASABY_TEMPLATE_PARAMETERS.join(', ');
   return new Function(params, body);
}

export function createTemplateFunctionString(name: string, body: string): string {
   const text = createTemplateFunction(body).toString();
   return replaceAnonymousFunctionName(name, text);
}