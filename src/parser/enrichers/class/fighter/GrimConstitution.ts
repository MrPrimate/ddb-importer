import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Sorrow Knight: resisting a Hit Point maximum reduction is a DC 15 Constitution save, rising by 5
 * for each further save until a rest. The activity's own uses count the saves made: dnd5e builds the
 * save card from an item clone taken before consumption, so the first save reads 0 spent (DC 15).
 *
 * dnd5e 5.2 has no "maximum" damage type (any other type comes off current Hit Points), so a failed
 * save leaves the reduction for the player to apply. The damage resistances stay on the feature's own
 * effect.
 */
export default class GrimConstitution extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Resist Hit Point Maximum Reduction",
      targetType: "self",
      rangeSelf: true,
      activationType: "special",
      activationCondition: "You are subjected to an effect that reduces your Hit Point maximum",
      addActivityConsume: true,
      data: {
        uses: {
          override: true,
          spent: null,
          max: "20",
          recovery: [{ period: "sr", type: "recoverAll" }],
        },
        save: {
          ability: ["con"],
          dc: {
            calculation: "",
            formula: "15 + (@activity.uses.spent * 5)",
          },
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      retainActivityUseSpent: true,
    };
  }

}
