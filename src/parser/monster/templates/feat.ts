import { SystemHelpers } from '../../lib/_module';

export function newFeat(name) {
  const feat = {
    name: name,
    type: "feat",
    system: SystemHelpers.getTemplate("feat"),
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
