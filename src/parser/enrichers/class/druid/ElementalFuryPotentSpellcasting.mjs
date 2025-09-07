/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ElementalFuryPotentSpellcasting extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@ability.wis.mod",
              types: ["cold", "fire", "lighting", "thunder"],
            }),
          ],
        },
      },
    };
  }

  get override() {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbElementalFuryPotentSpellcasting">
<p><strong>Implementation Details</strong></p>
<p>DDB Importer will automatically adjust cantrip damage on spells when importing a character.</p>
</section>`,
    };
  }
}
