import DDBEnricherData from "../../data/DDBEnricherData";

export default class BrittleBoneArmor extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "action",
      data: {
        range: {
          units: "self",
        },
        duration: {
          units: "hour",
          value: "1",
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "2 * @classes.wizard.levels",
          types: ["temphp"],
        }),
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Brittle Bone Armor",
        options: {
          durationSeconds: 3600,
          description: "While the Temporary Hit Points last you have Resistance to Piercing and Slashing damage and a +2 bonus to AC.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("2", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("piercing"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("slashing"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Brittle Bone Armor",
        includesName: true,
        max: "1",
        period: "lr",
      }),
    };
  }

}
