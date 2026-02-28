import DDBEnricherData from "../../data/DDBEnricherData";

export default class MutateShape extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get additionalActivities() {
    const results = [
      {
        init: {
          name: "Clear Mutation Point",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: "@item.uses.value",
                scaling: { mode: "", formula: "" },
              },
            ],
          },
        },
        overrides: {
          activationType: "special",
        },
      },
      {
        init: {
          name: "Spend Spell Slot to Gain Mutation Points",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          consumptionOverride: {
            scaling: { allowed: true, max: "9" },
            spellSlot: true,
            targets: [
              {
                type: "itemUses",
                target: "",
                value: "-1",
                scaling: { mode: "amount", formula: "-1" },
              },
              {
                type: "spellSlots",
                value: "1",
                target: "1",
                scaling: { mode: "level", formula: "" },
              },
            ],
          },
        },
        overrides: {
          activationType: "bonus",
        },
      },
    ];
    return results;
  }

  get override() {
    const action = this.ddbParser.ddbData?.character.actions["class"]
      .find((a) => a.name.includes(": Mutation Points"));

    const uses = this._getUsesWithSpent({
      type: "class",
      name: ": Mutation Points",
      max: action?.limitedUse.maxUses ?? "9",
      period: "lr",
      includesName: true,
      uses: action?.limitedUse.maxUses ?? "9",
    });

    return {
      data: {
        system: {
          uses,
        },
      },
    };
  }

}
