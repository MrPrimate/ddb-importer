import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Shadow Court level 3. Enshadowed Equipment (Intelligence modifier uses per Long Rest) and DDB's
 * two Martial Artist Unarmed Strikes, which keep the Grappled status their Grapple text gives them.
 * Enshadowed Equipment conjures gear, so it links no effect. Covert Warrior's proficiencies are
 * advancements.
 */
export default class HandAndFootTraining extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Enshadowed Equipment",
      activationType: "bonus",
      activationCondition: "Conjure Caltrops, a Costume, Crowbar, Grappling Hook, Ladder, Net, Parchment, Rope, Signal Whistle, Spyglass, or Thieves' Tools",
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
      noeffect: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return ["Dexterity", "Strength"].map((ability) => ({
      action: { name: `Unarmed Strike: Martial Artist (${ability})`, type: "class" },
      overrides: { noeffect: true },
    }));
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Hand and Foot Training: Enshadowed Equipment",
        max: "max(1, @abilities.int.mod)",
        period: "lr",
      }),
    };
  }

}
