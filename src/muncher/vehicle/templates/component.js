import utils from '../../../utils.js';

export function newComponent(name, type) {
  let feat = {
    name: name,
    type: type,
    data: JSON.parse(utils.getTemplate(type)),
    flags: {
      ddbimporter: {
        dndbeyond: {
        },
      },
    },
  };
  return feat;
};
