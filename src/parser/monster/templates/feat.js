import { utils } from '../../../lib/_module.mjs';

export function newFeat(name) {
  let feat = {
    name: name,
    type: "feat",
    system: utils.getTemplate("feat"),
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
