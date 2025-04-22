// https://github.com/cdklabs/decdk/tree/v2.0.0-pre.602/src/type-system

import * as reflect from 'jsii-reflect';

export function isBehavioralInterface(type: reflect.Type | undefined): type is reflect.InterfaceType {
  if (!type || !type.isInterfaceType()) {
    return false;
  }

  return (
    type.name.startsWith('I') &&
    // Must check second char, otherwise names like `Integration` would match as well
    type.name[1] === type.name[1]!.toLocaleUpperCase()
  );
}
