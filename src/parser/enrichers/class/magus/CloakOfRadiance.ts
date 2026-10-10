import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Heaven's Guard level 14. A Bonus Action wraps a creature within 30 feet in radiant light:
 * 5d10 + Magus level temporary Hit Points (DDB's dice carry the capture's level as a fixed value,
 * so the formula is rebuilt), and while they last attacks against it have Disadvantage, it sheds
 * light, and it can fly 30 feet as a Bonus Action. The effect has no counted duration; remove it
 * when the temporary Hit Points run out.
 */
export default class CloakOfRadiance extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cloak of Radiance",
      activationType: "bonus",
      addItemConsume: true,
      targetType: "creature",
      targetCount: 1,
      rangeValue: 30,
      rangeType: "ft",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 5,
          denomination: 10,
          bonus: "@classes.magus.levels",
          types: ["temphp"],
          scalingMode: "none",
        }),
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Cloak of Radiance",
        options: {
          durationSeconds: null,
          description: "While this creature has the temporary Hit Points: creatures not immune to Blinded have Disadvantage on attacks against it; it sheds Bright Light 30 feet and Dim Light 30 feet beyond; it can take a Bonus Action to fly up to 30 feet, falling harmlessly if it does not land.",
        },
        atlChanges: [
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "ATL.light.bright"),
          DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "ATL.light.dim"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.grants.attack.disadvantage"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.disadvantage.attack.all"),
        ],
      },
    ];
  }

}
