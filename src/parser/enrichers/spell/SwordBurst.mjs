/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

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
