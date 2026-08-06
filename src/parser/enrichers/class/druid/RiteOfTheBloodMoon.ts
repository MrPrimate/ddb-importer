import DDBEnricherData from "../../data/DDBEnricherData";

export default class RiteOfTheBloodMoon extends DDBEnricherData {

  get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  get type() {
    if (this.isAction) return null;
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData | null {
    if (this.isAction) return null;
    return {
      name: "Activate Blood Moon",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Wild Shape",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "3 * @classes.druid.levels",
          types: ["temphp"],
        }),
        duration: {
          value: "10",
          units: "minute",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Blood Moon",
        activityMatch: "Activate Blood Moon",
        options: {
          durationSeconds: 600,
          description: "Speed increases by 10 feet, you can take the Dash action as a Bonus Action, and once per hit you can deal an extra 1d6 Necrotic damage with weapon or Unarmed Strike attacks.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("10", 20, "system.attributes.movement.walk"),
        ],
      },
    ];
  }

}
