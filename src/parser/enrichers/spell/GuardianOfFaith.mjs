/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class GuardianOfFaith extends DDBEnricherData {
  get type() {
    return "summon";
  }

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getGuardianOfFaith;
  }

  get generateSummons() {
    return true;
  }

  get activity() {
    return {
      type: "summon",
      noTemplate: true,
      profileKeys: this.is2014
        ? [{ count: 1, name: "GuardianOfFaith2014" }]
        : [{ count: 1, name: "GuardianOfFaith2024" }],
      summons: {
        match: {
          saves: true,
        },
      },
    };
  }

  get override() {
    return {
      data: {
        flags: {
          ddbimporter: {
            disposition: {
              match: true,
            },
          },
        },
      },
    };
  }
}
