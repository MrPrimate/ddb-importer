import DDBEnricherData from "../../data/DDBEnricherData";

export default class NaturalRecovery extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Natural Recovery: Cast Circle Spell",
      max: "1",
      period: "1r",
    });

    return {
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      name: "Cast Circle Spell",
      addActivityConsume: true,
      data: {
        uses,
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Recover Spell Slots",
          type: DDBEnricherData.ACTIVITY_TYPES.DDBMACRO,
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
