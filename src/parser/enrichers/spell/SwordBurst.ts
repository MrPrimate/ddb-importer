import DDBEnricherData from "../data/DDBEnricherData";

export default class SwordBurst extends DDBEnricherData {
  override get override(): IDDBOverrideData {
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
