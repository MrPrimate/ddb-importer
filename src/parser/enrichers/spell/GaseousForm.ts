import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Gaseous Form: the target becomes a misty cloud with a hovering fly speed of 10 feet, resistance to nonmagical bludgeoning, piercing and slashing damage, and cannot be knocked Prone.
 */
export default class GaseousForm extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Gaseous Form",
        statuses: ["Transformed"],
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("10", 20, "system.attributes.movement.fly"),
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "system.attributes.movement.hover"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("piercing"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("slashing"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("prone"),
        ],
        options: {
          description: "Misty cloud: Fly Speed 10 feet (hover), advantage on Str, Dex and Con saves, can pass through small openings, can't attack, cast spells, talk or manipulate objects.",
        },
      },
    ];
  }

}
