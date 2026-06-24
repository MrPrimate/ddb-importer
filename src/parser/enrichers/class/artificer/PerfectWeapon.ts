import DDBEnricherData from "../../data/DDBEnricherData";

export default class PerfectWeapon extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get clearAutoEffects() {
    return true;
  }

  get override(): IDDBOverrideData {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbCheatDeath">
<p><strong>Implementation Details</strong></p>
<p>These are included in your Ghaal'Shaarat weapon enchantment.</p>
</section>`,
    };
  }

}
