import utils from '../../../utils.js';

export function newFeat(name) {
  let feat = {
    name: name,
    type: "feat",
    data: JSON.parse(utils.getTemplate("feat")),
    flags: {
      ddbimporter: {
        dndbeyond: {
        },
      },
    },
  };
  return feat;
};
