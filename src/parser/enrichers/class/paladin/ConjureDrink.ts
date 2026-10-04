import DDBEnricherData from "../../data/DDBEnricherData";

/** Channel Divinity: Conjure Drink. Drinking a mug (a bonus action) grants temporary hit points equal to the paladin's Charisma modifier and Advantage on saving throws for a minute. */
export default class ConjureDrink extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: { name: "Drink Ale", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateHealing: true,
          activationOverride: { type: "bonus", value: 1, condition: "A creature drinks a conjured mug" },
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: "max(1, @abilities.cha.mod)", types: ["temphp"] }),
        },
        overrides: { targetType: "creature", targetCount: 1, noConsumeTargets: true, noTemplate: true },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Frothy Ale",
        activityMatch: "Drink Ale",
        options: { durationSeconds: 60, description: "Advantage on saving throws." },
        changes: ["str", "dex", "con", "int", "wis", "cha"].map((ability) =>
          DDBEnricherData.ChangeHelper.abilitySaveRollModeChange(ability, DDBEnricherData.ChangeHelper.ADVANTAGE),
        ),
      },
    ];
  }

  // drinking is free; the post-import link would otherwise charge it a Channel Divinity use
  override get override(): IDDBOverrideData {
    return {
      ignoredConsumptionActivities: ["Drink Ale"],
    };
  }

}
