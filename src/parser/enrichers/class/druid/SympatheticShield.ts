import DDBEnricherData from "../../data/DDBEnricherData";

export default class SympatheticShield extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Create Shield",
      targetType: "creature",
      activationType: "action",
      addItemConsume: true,
      itemConsumeTargetName: "Wild Shape",
      data: {
        range: {
          units: "ft",
          value: "30",
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "(floor(@classes.druid.levels / 3))d10",
          types: ["temphp"],
        }),
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      { action: { name: "Sympathetic Shield: Retaliation", type: "class" } },
    ];
  }

  get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Sympathetic Shield",
        activityMatch: "Create Shield",
        options: {
          description: "The shielded creature has a +1 bonus to AC until the temporary hit points are expended or replaced.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }

}
