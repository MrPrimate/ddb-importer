import utils from '../../../utils/utils.js';

export function newFeat(name) {
  let feat = {
    name: name,
    type: "feat",
    system: JSON.parse(utils.getTemplate("feat")),
    effects: [],
    flags: {
      ddbimporter: {
        dndbeyond: {
        },
      },
    },
  };
  return feat;
};
