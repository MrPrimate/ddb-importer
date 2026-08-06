import DDBEnricherData from "../../data/DDBEnricherData";

export default class BecomeDeath extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Become Death",
      targetType: "self",
      activationType: "special",
      activationCondition: "When you are reduced to 0 HP and not killed outright",
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "floor(@attributes.hp.max / 2)",
          types: ["temphp"],
        }),
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Become Death",
        activityMatch: "Become Death",
        options: {
          description: "While you have Temporary Hit Points from this feature you have Resistance to all damage, a Fly Speed of 30 feet, can Hover, and can move through occupied spaces as Difficult Terrain. At the start of each of your turns you lose 10 Temporary Hit Points and creatures of your choice within 30 feet take 10 Necrotic damage.",
        },
        changes: [
          ...DDBEnricherData.allDamageTypes().map((t) =>
            DDBEnricherData.ChangeHelper.damageResistanceChange(t),
          ),
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.attributes.movement.fly"),
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "system.attributes.movement.hover"),
        ],
      },
    ];
  }

}
