/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class NaturalRecovery extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Natural Recovery: Cast Circle Spell",
      max: "1",
      period: "1r",
    });

    return {
      type: "utility",
      name: "Cast Circle Spell",
      addActivityConsume: true,
      data: {
        uses,
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Recover Spell Slots",
          type: "ddbmacro",
        },
        build: {
          generateConsumption: true,
          generateRange: true,
          generateTarget: true,
          generateUses: true,
          generateDDBMacro: true,
          usesOverride: this._getUsesWithSpent({
            type: "class",
            name: "Natural Recovery: Recover Spell Slots",
            max: "1",
            period: "lr",
          }),
          targetOverride: {
            affects: {
              type: "self",
            },
          },
          rangeOverride: {
            units: "self",
          },
          consumptionOverride: {
            targets: [
              {
                type: "activityUses",
                target: "",
                value: "1",
                scaling: { mode: "", formula: "" },
              },
            ],
            scaling: { allowed: false, max: "" },
          },
          ddbMacroOverride: {
            name: "Natural Recovery",
            function: "ddb.feat.naturalRecovery",
            visible: false,
            parameters: "",
          },
        },
      },
    ];
  }
}
