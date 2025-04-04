import * as reflect from 'jsii-reflect';
import { Initializer, TypeReference } from 'jsii-reflect';
// import { methodFQN } from "../type-resolution/callables";
import { allImplementationsOfType, enumLikeClassMethods, enumLikeClassProperties, isConstruct } from './index.js';
import { allStaticFactoryMethods, allStaticMethods } from './factories.js';

export function methodFQN(method: reflect.Method): string {
  return `${method.parentType.fqn}.${method.name}`;
}

export function schemaForTypeReference(type: reflect.TypeReference): any {
  // console.log("evaluating " + type.toString());
  if (type.fqn === 'cdktf.IResolvable') {
    // TODO: skipping IResolvable for now
    return undefined; // { $ref: `#/definitions/cdktf.IResolvable` };
  }
  const prim = schemaForPrimitive(type);
  if (prim) {
    return prim;
  }

  const arr = schemaForArray(type);
  if (arr) {
    return arr;
  }

  const map = schemaForMap(type);
  if (map) {
    return map;
  }

  const union = schemaForUnion(type);
  if (union) {
    return union;
  }

  const constructRef = schemaForConstructRef(type);
  if (constructRef) {
    // console.log('is constructRef: ' + type.fqn);
    return constructRef;
  }

  const iface = schemaForInterface(type.type);
  if (iface) {
    return iface;
  }

  const enm = schemaForEnum(type.type);
  if (enm) {
    return enm;
  }

  const enumLike = schemaForEnumLikeClass(type.type);
  if (enumLike) {
    return enumLike;
  }

  const cls = schemaForPolymorphic(type.type);
  if (cls) {
    return cls;
  }

  return undefined;
}

function schemaForPolymorphic(type: reflect.Type | undefined) {
  if (!type) {
    return undefined;
  }

  const anyOf = new Array<any>();
  for (const x of allImplementationsOfType(type)) {
    const enumLike = schemaForEnumLikeClass(x);
    if (enumLike) {
      anyOf.push(enumLike);
    }

    if (x.initializer) {
      const methd = methodSchema(x.initializer);
      if (methd) {
        anyOf.push(methd);
      }
    }
  }

  // If there are any acceptable implementations, they will also be allowed at the top-level
  // So we need to allow Ref here as well
  if (anyOf.length >= 1) {
    anyOf.unshift(schemaForReferences());
  }

  for (const method of allStaticFactoryMethods(type)) {
    const methd = methodSchema(method);
    if (methd) {
      anyOf.push(methd);
    }
  }

  if (anyOf.length === 0) {
    return undefined;
  }

  return { anyOf };
}

function schemaForEnum(type: reflect.Type | undefined) {
  if (!type || !(type instanceof reflect.EnumType)) {
    return undefined;
  }

  return {
    enum: type.members.map(m => m.name),
  };
}

function schemaForMap(type: reflect.TypeReference) {
  if (!type.mapOfType) {
    return undefined;
  }

  const s = schemaForTypeReference(type.mapOfType);
  if (!s) {
    return undefined;
  }

  return {
    type: 'object',
    additionalProperties: s,
  };
}

function schemaForArray(type: reflect.TypeReference) {
  if (!type.arrayOfType) {
    return undefined;
  }

  const s = schemaForTypeReference(type.arrayOfType);
  if (!s) {
    return undefined;
  }

  return {
    type: 'array',
    items: s,
  };
}

function schemaForPrimitive(type: reflect.TypeReference): any {
  if (!type.primitive) {
    return undefined;
  }
  switch (type.primitive) {
    case 'date':
      return { type: 'string', format: 'date-time' };
    case 'json':
      return { type: 'object' };
    case 'any':
      return {}; // this means "any"
    case 'string':
    case 'number':
    case 'boolean':
    default:
      return { type: type.primitive };
  }
}

function schemaForUnion(type: reflect.TypeReference): any {
  if (!type.unionOfTypes) {
    return undefined;
  }

  const anyOf = type.unionOfTypes.map(x => schemaForTypeReference(x)).filter(x => x); // filter failed schemas

  if (anyOf.length === 0) {
    return undefined;
  }

  return { anyOf };
}

function schemaForConstructRef(type: TypeReference) {
  if (!isConstruct(type)) {
    return undefined;
  }

  return schemaForReferences(type.type);
}

function schemaForReferences(type?: reflect.Type) {
  const anyOf = [];
  if (type) {
    const methods = allStaticMethods(type.system).filter(m => m.returns.type.type?.extends(type));

    anyOf.push(
      ...methods.map(m => ({
        [methodFQN(m)]: {},
      })),
    );
  }
  return { anyOf };
}

function schemaForInterface(type: reflect.Type | undefined) {
  if (!type || !(type instanceof reflect.InterfaceType)) {
    return undefined; // skip
  }

  if (type.allMethods.length > 0) {
    return undefined;
  }

  const define = () => {
    const properties: any = {};
    const required = new Array<string>();

    // don't include inherited properties
    for (const prop of type.ownProperties) {
      const schema = schemaForTypeReference(prop.type);
      if (!schema) {
        // if prop is not serializable but optional, we can still serialize
        // but without this property.
        if (prop.optional) {
          continue;
        }

        // error
        console.log('property cannot be schematized');
        return undefined;
      }

      if (schema.$ref != null) {
        properties[prop.name] = {
          anyOf: [withDescription(prop, schema), withDescription(prop, schemaForReferences())],
        };
      } else {
        properties[prop.name] = withDescription(prop, schema);
      }

      if (!prop.optional) {
        required.push(prop.name);
      }
    }

    function withDescription(prop: reflect.Property, obj: Record<string, unknown>) {
      const docstring = prop.docs.toString();
      return docstring ? { ...obj, description: docstring } : obj;
    }

    // return {
    //   type: 'object',
    //   title: type.name,
    //   additionalProperties: false,
    //   properties,
    //   required: required.length > 0 ? required : undefined,
    // };
    return properties;
  };
  return define();
}

export function schemaForEnumLikeClass(type: reflect.Type | undefined) {
  if (!type || !(type instanceof reflect.ClassType)) {
    return undefined;
  }

  const enumLikeProps = enumLikeClassProperties(type);
  const enumLikeMethods = enumLikeClassMethods(type);
  const constructorParams = type.initializer?.parameters ?? [];

  if (enumLikeProps.length === 0 && enumLikeMethods.length === 0) {
    return undefined;
  }

  const anyOf = new Array<any>();

  if (enumLikeProps.length > 0) {
    anyOf.push({ enum: enumLikeProps.map(m => m.name) });
  }

  for (const method of enumLikeMethods) {
    const methd = methodSchema(method);
    if (methd) {
      anyOf.push(methd);
    }
  }

  anyOf.push({
    additionalProperties: false,
    type: 'object',
    properties: {
      Type: {
        type: 'string',
        enum: [type.fqn],
      },
      // Call: ctx.define('Call', schemaForCall),
    },
  });

  if (type.initializer) {
    anyOf.push({
      type: 'object',
      additionalProperties: false,
      properties: schemaForConstructorParams(type.fqn, constructorParams),
    });
  }

  return { anyOf };

  function schemaForConstructorParams(fqn: string, parameters: reflect.Parameter[]) {
    const items = parameters.map(item);
    const base = {
      type: 'array',
      maxItems: items.length,
    };

    return {
      [fqn]: items.length > 0 ? { anyOf: [{ ...base, items }, items[0]] } : base,
    };
  }

  function item(parameter: reflect.Parameter): any {
    const fqn = parameter.type.fqn;
    if (fqn != null && fqn === type?.fqn) {
      return fqn;
    }
    return schemaForTypeReference(parameter.type);
  }
}

function methodSchema(method: reflect.Callable) {
  // const fqn = `${method.parentType.fqn}.${method.name}`;

  const properties: any[] = [];
  const required = new Array<string>();

  const addProperty = (prop: reflect.Property | reflect.Parameter): void => {
    const param = schemaForTypeReference(prop.type);

    // bail out - can't serialize a required parameter, so we can't serialize the method
    if (!param && !prop.optional) {
      console.log('cannot schematize method because parameter cannot be schematized');
      return undefined;
    }

    properties.push(param);

    if (!prop.optional) {
      required.push(prop.name);
    }
  };

  for (let i = 0; i < method.parameters.length; ++i) {
    const p = method.parameters[i]!;
    addProperty(p);
  }

  const requiredParams = method.parameters.filter(p => !p.optional);
  if (requiredParams.length > 0 && requiredParams.length !== required.length) {
    // If at least one required parameter cannot be schematized,
    // the whole method cannot be schematized.
    return;
  }

  const basicSchema =
    required.length > 0
      ? {
          type: 'array',
          items: properties.map(p => ({
            anyOf: [p, 'IntrinsicExpression'],
          })),
          maxItems: properties.length,
        }
      : {
          type: ['array', 'null'],
          maxItems: 0,
        };

  const methodCallName = Initializer.isInitializer(method)
    ? method.parentType.fqn
    : `${method.parentType.fqn}.${method.name}`;

  const callSchema = (schema: any) => ({
    type: 'object',
    additionalProperties: false,
    properties: {
      [methodCallName]: schema,
    },
  });

  if (basicSchema.items && basicSchema.items.length > 0 && required.length < 2) {
    return callSchema({
      anyOf: [basicSchema, basicSchema.items[0]],
    });
  }

  return callSchema(basicSchema);
}
