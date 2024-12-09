import { SystemHelpers } from '../../lib/_module.mjs';

export function newComponent(name, type) {
  let feat = {
    name: name,
    type: type,
    system: SystemHelpers.getTemplate(type),
    flags: {
      ddbimporter: {
        dndbeyond: {
        },
      },
    },
  };
  return feat;
};
