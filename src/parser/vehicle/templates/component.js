import { utils } from '../../../lib/_module.mjs';

export function newComponent(name, type) {
  let feat = {
    name: name,
    type: type,
    system: utils.getTemplate(type),
    flags: {
      ddbimporter: {
        dndbeyond: {
        },
      },
    },
  };
  return feat;
};
