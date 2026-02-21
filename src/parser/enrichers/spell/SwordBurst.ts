import DDBEnricherData from "../data/DDBEnricherData";

export default class SwordBurst extends DDBEnricherData {
  get override() {
    return {
      data: {
        flags: {
          "midi-qol": {
            AoETargetType: "any",
            AoETargetTypeIncludeSelf: false,
          },
        },
      },
    };
  }

}
