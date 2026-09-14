import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Wind Walk: the targets become gaseous clouds with a hovering fly speed of 300 feet, resistance to nonmagical bludgeoning, piercing and slashing damage, and cannot be knocked Prone.
 */
export default class WindWalk extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Cloud Form",
        statuses: ["Transformed"],
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("300", 20, "system.attributes.movement.fly"),
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "system.attributes.movement.hover"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("prone"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("piercing"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("slashing"),
        ],
        options: {
          description: "Cloud form: the only actions available are Dash and reverting (which takes 1 minute, during which the creature is Incapacitated).",
        },
      },
    ];
  }

}
