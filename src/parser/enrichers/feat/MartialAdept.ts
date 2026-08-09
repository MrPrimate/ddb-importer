import DDBEnricherData from "../data/DDBEnricherData";

export default class MartialAdept extends DDBEnricherData {


  override get override(): IDDBOverrideData {
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

  override get effects(): IDDBEffectHint[] {
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
