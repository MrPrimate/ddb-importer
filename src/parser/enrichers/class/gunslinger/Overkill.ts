import DDBEnricherData from "../../data/DDBEnricherData";

export default class Overkill extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "You deal damage with a Ranged weapon that already adds your ability modifier",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 8,
              types: ["bludgeoning", "piercing", "slashing"],
            }),
          ],
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: `<section class="secret ddbSecret" id="secret-ddbOverkill">
Ranged weapons in your inventory already handle this feature themselves: those with the Firearm property add your ability modifier to their damage, and the rest roll the extra 1d8 as part of their own attack. The activity below is a manual fallback for a Ranged weapon that was not imported from D&D Beyond, so do not use it on top of one that was.
</section>`,
    };
  }

}
