import DDBEnricherData from "../../data/DDBEnricherData";

export default class AuraOfMalevolence extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      addItemConsume: true,
      targetType: "creature",
      itemConsumeTargetName: "Bloodthirst",
      activationType: "reaction",
      data: {
        // each creature of your choice within 10 feet of the space you left or your destination
        target: {
          template: { count: "1", size: "10", units: "ft", type: "radius" },
          affects: { type: "creature", choice: true },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@abilities.int.mod",
              types: ["necrotic", "poison", "psychic"],
            }),
          ],
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbAuraOfMalevolence">
<p><strong>Implementation Details</strong></p>
<p>You can use this feature instead of Bloodthirst, it will consume a Bloodthirst use.</p>
</section>`,
    };
  }

}
