import DDBEnricherData from "../../data/DDBEnricherData";

export default class SuperiorDread extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get override(): IDDBOverrideData {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbCheatDeath">
<p><strong>Implementation Details</strong></p>
<p>These are automatically included in your Form of Dread.</p>
</section>`,
    };
  }

}
