import DDBEnricherData from "../../data/DDBEnricherData";

export default class WoodWose extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Wood Wose",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Wild Shape",
      data: {
        range: {
          units: "self",
        },
        duration: {
          value: "10",
          units: "minute",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Elderwood Sap",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "When you hit a creature with an attack roll",
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Wood Wose",
        activityMatch: "Wood Wose",
        options: {
          durationSeconds: 600,
          description: "While you aren't wearing armor, your base Armor Class is 10 plus your Dexterity and Wisdom modifiers (applied as a minimum AC; a shield is not added on top of it), and you have Advantage on Strength and Constitution saving throws.",
        },
        changes: [
          // a minimum, so an AC that is already higher is kept
          DDBEnricherData.ChangeHelper.upgradeChange("10 + @abilities.dex.mod + @abilities.wis.mod", 20, "system.attributes.ac.min"),
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange("str"),
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange("con"),
        ],
      },
      {
        name: "Coated in Elderwood Sap",
        activityMatch: "Elderwood Sap",
        options: {
          durationSeconds: 6,
          durationRounds: 1,
          expiry: "sourceStart",
          description: "While coated in Elderwood sap, the target has Disadvantage on attack rolls against targets other than the druid.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("!workflow.target.getName('@token.name')", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
      },
    ];
  }

}
