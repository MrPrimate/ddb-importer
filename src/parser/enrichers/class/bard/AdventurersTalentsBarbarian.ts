import DDBEnricherData from "../../data/DDBEnricherData";

export default class AdventurersTalentsBarbarian extends DDBEnricherData {

  get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Rampage",
        activityMatch: "Rampage",
        options: {
          durationSeconds: 60,
          description: "Resistance to Bludgeoning, Piercing, and Slashing damage; you can't maintain Concentration. Ends early if you use a Bonus Action or have the Incapacitated condition.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("piercing"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("slashing"),
        ],
      },
    ];
  }

}
