import DDBEnricherData from "../../data/DDBEnricherData";

export default class CheatDeath extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "20 * @scaling",
          types: ["healing"],
        }),
        consumption: {
          scaling: {
            allowed: true,
            max: "@scale.artificer.replicate-magic-item",
          },
          spellSlot: true,
          targets: [],
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbCheatDeath">
<p><strong>Implementation Details</strong></p>
<p>Choose the number of items you disintegrate as the scaling choice.</p>
</section>`,
    };
  }
}
