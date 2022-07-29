// import logger from '../../../logger.js';
import utils from '../../../utils.js';

export function newComponent(name, type) {
  // logger.debug("Generating new component:", { name, type });
  let feat = {
    name: name,
    type: type,
    system: JSON.parse(utils.getTemplate(type)),
    flags: {
      ddbimporter: {
        dndbeyond: {
        },
      },
    },
  };
  return feat;
};
