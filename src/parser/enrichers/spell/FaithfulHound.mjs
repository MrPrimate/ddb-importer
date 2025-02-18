/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class FaithfulHound extends DDBEnricherData {

  get type() {
    return "summon";
  }

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getFaithfulHound;
  }

  get generateSummons() {
    return true;
  }

  get activity() {
    return {
      type: "summon",
      noTemplate: true,
      profileKeys: this.is2014
        ? [
          { count: 1, name: "FaithfulHound2014" },
        ]
        : [
          { count: 1, name: "FaithfulHound2024" },
        ],
      summons: {
        "match": {
          "proficiency": this.is2014,
          "attacks": this.is2014,
          "saves": !this.is2014,
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
