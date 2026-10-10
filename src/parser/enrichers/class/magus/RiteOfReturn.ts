import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Magus level 9. The Mystic Mark spell slot comes back when the mark ends unreleased, or when the
 * magus ends it with a Bonus Action. Both activities give back one slot, its level picked as the
 * scaling.
 */
export default class RiteOfReturn extends DDBEnricherData {

  static regainSlot(): Partial<IDDBActivityData> {
    return {
      targetType: "self",
      rangeSelf: true,
      noConsumeTargets: true,
      addSpellSlotConsume: true,
      spellSlotConsumeTarget: "1",
      spellSlotConsumeValue: "-1",
      addSpellSlotScalingMode: "level",
      addConsumptionScalingMax: "5",
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Regain Spell Slot",
      activationType: "none",
      activationCondition: "Your Mystic Mark ends without you releasing the spell",
      ...RiteOfReturn.regainSlot(),
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "End Mystic Mark",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
          generateRange: true,
        },
        overrides: {
          activationType: "bonus",
          activationCondition: "End your Mystic Mark and regain its spell slot",
          ...RiteOfReturn.regainSlot(),
        },
      },
    ];
  }

}
