/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DurableMagic extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.bonuses.abilities.save"),
        ],
        options: {
          description: "Whilst concentrating on a spell.",
          transfer: true,
          disabled: true,
        },
      },
    ];
  }

  get override() {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbDurableMagic">
<p><strong>Implementation Details</strong></p>
<p>An effect has been created that can be toggled when concentrating on a spell.</p>
</section>`,
    };
  }

}
