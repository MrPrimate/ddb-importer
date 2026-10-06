import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * 2014 Circle of the Moon: while Wild Shaped, a bonus action and a spell slot regain 1d8 hit points
 * per slot level. The slot is a level-1 target that scales, so each level above 1st adds a die.
 */
export default class CombatWildShape extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Expend Spell Slot",
      targetType: "self",
      rangeSelf: true,
      activationType: "bonus",
      activationCondition: "While transformed by Wild Shape",
      data: {
        consumption: {
          targets: [
            {
              type: "spellSlots",
              value: "1",
              target: "1",
              // "level" raises the slot with the chosen scaling; any other mode always spends a 1st-level slot
              scaling: { mode: "level", formula: "" },
            },
          ],
          scaling: {
            allowed: true,
            // the slider value is the slot level, up to 9th
            max: "9",
          },
          spellSlot: true,
        },
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 8,
          types: ["healing"],
          scalingMode: "whole",
          scalingNumber: 1,
        }),
      },
    };
  }

}
