import DDBEnricherData from "../../data/DDBEnricherData";

export default class Overkill extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      rangeType: "any",
      activationType: "special",
      activationCondition: "You deal damage with a Ranged weapon that already adds your ability modifier",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 8,
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: `<section class="secret ddbSecret" id="secret-ddbOverkill">
Ranged weapons imported from D&D Beyond already handle this feature: those with the Firearm property add your ability modifier to their damage, and the rest roll the extra 1d8 as part of their own attack. When Mage Hand Press Core's Overkill automation is enabled, it supplies that extra die. Reimport your weapons after enabling or disabling the module or its Overkill automation. Use the activity below only as a manual fallback for a Ranged weapon whose attack does not already include the extra die.
</section>`,
    };
  }

}
