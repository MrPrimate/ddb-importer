/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class AuraOfMalevolence extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      addItemConsume: true,
      targetType: "creature",
      itemConsumeTargetName: "Bloodthirst",
      activationType: "reaction",
      data: {
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

  get override() {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbAuraOfMalevolence">
<p><strong>Implementation Details</strong></p>
<p>You can use this feature instead of Bloodthirst, it will consume a Bloodthirst use.</p>
</section>`,
    };
  }

}
