import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Sidereal Cabal level 7. After a creature within 60 feet makes a D20 Test, spend a spell slot to
 * raise or lower the result by the slot's level (picked as the scaling); once until the start of
 * the magus's next turn.
 */
export default class CelestialClockworkControl extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Modify Roll",
      activationType: "special",
      activationCondition: "After a creature you can see within 60 feet makes a D20 Test; add or subtract the slot level",
      targetType: "creature",
      targetCount: 1,
      rangeValue: 60,
      rangeType: "ft",
      noConsumeTargets: true,
      addActivityConsume: true,
      addSpellSlotConsume: true,
      spellSlotConsumeTarget: "1",
      spellSlotConsumeValue: "1",
      addSpellSlotScalingMode: "level",
      addConsumptionScalingMax: "5",
      data: {
        uses: {
          spent: 0,
          max: "1",
          recovery: [{ period: "turnStart", type: "recoverAll" }],
        },
        roll: {
          prompt: false,
          visible: true,
          formula: "@scaling",
          name: "Roll Adjustment",
        },
      },
    };
  }

}
