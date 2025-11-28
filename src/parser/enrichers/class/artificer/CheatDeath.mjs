/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class CheatDeath extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
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

  get override() {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbCheatDeath">
<p><strong>Implementation Details</strong></p>
<p>Choose the number of items you disintegrate as the scaling choice.</p>
</section>`,
    };
  }
}
