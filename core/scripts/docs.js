var fs = require('fs');

let json = JSON.parse(fs.readFileSync('dist/docs.json'));

// Get the core-plugin-definitions.ts child and all of its children
var moduleChildren = json.children[0].children;

// Plugins are defined as BlahPlugin
let plugins = moduleChildren.filter(c => c.name.endsWith('Plugin'));

const generateDocumentationForPlugin = (plugin) => {
  console.log(`\n\nPlugin: ${plugin.name}`);
  let methodChildren = plugin.children.filter(m => m.name != 'addListener' && m.name != 'removeListener');
  let listenerChildren = plugin.children.filter(m => m.name == 'addListener' || m.name == 'removeListener');
  methodChildren.forEach(method => generateMethod(method));
};

const generateMethod = (method) => {
  const signature = generateMethodSignature(method);
  console.log(signature);
};

const generateMethodSignature = (method) => {
  const parts = [method.name, '('];
  const signature = method.signatures[0];

  // Build the params portion of the method
  const params = signature.parameters;
  params && params.forEach((param, i) => {
    parts.push(param.name)

    if(param.flags && param.flags.isOptional) {
      parts.push('?');
    }

    parts.push(': ');
    parts.push(getParamTypeName(param));
    if(i < params.length-1) {
      parts.push(', ');
    }
  });
  parts.push('): ');

  const returnType = signature.type;

  // Add the return type of the method
  parts.push(getReturnTypeName(returnType));

  return parts.join('');
}

const getParamTypeName = (param) => {
  const t = param.type.type;
  if(t == 'reference') {
    return param.type.name;
  }
  return 'any';
};

const getReturnTypeName = (returnType) => {
  const r = returnType;
  const type = `${r.name}`;

  if(r.typeArguments) {
    const typeArgParts = r.typeArguments.map(a => a.name);
    return type + `<${typeArgParts.join(',')}>`;
  }

  return type;
};

// Generate documentation for each plugin
plugins.forEach(plugin => generateDocumentationForPlugin(plugin));