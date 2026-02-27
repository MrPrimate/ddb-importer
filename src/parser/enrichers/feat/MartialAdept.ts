import DDBEnricherData from "../data/DDBEnricherData";

export default class MartialAdept extends DDBEnricherData {


  get override() {
    return {
      retainResourceConsumption: true,
      uses: this.hasClassFeature({ featureName: "Combat Superiority", className: "Fighter" })
        ? {
          spent: null,
          max: null,
          recovery: [],
        }
        : this._getUsesWithSpent({
          type: "feat",
          name: "Superiority Dice (Martial Adept)",
          max: "1",
          period: "sr",
        }),
    };
  }

  get effects() {
    return [
      {
        name: "Martial Adept",
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("1", 20, "system.scale.battle-master.combat-superiority-uses.value"),
          DDBEnricherData.ChangeHelper.addChange("1", 20, "system.scale.battle-master.combat-superiority.number"),
        ],
      },
    ];
  }

}
