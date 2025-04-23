// https://github.com/cdklabs/decdk/tree/v2.0.0-pre.602/src/type-system

import * as reflect from 'jsii-reflect';

const CACHE: Record<symbol, any> = {};

/**
 * Return all static methods from this type system
 *
 * Cache on the type system to not have to do this calculation again and again.
 */
export function allStaticMethods(ts: reflect.TypeSystem): reflect.Method[] {
  const cacheSymbol = Symbol(ts.assemblies.map(a => a.name + a.version).join());
  if (CACHE[cacheSymbol]) {
    return CACHE[cacheSymbol];
  }

  const methods = ts.classes.flatMap(x => x.ownMethods);
  return (CACHE[cacheSymbol] = methods);
}

/**
 * Return all static factory methods that implement the given type
 */
export function allStaticFactoryMethods(type: reflect.Type) {
  return allStaticMethods(type.system)
    .filter(m => m.returns.type.fqn === type.fqn)
    .filter(m => m.parentType !== type);
}
