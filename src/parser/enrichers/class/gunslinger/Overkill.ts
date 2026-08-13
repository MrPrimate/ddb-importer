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
Weapons with the Firearm property in your inventory add your ability modifier to their damage automatically, because you have this feature. The activity below covers the other case, a Ranged weapon that already adds your modifier.
</section>`,
    };
  }

}
