import DDBEnricherData from "../../data/DDBEnricherData";

export default class ShieldingStorm extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbShieldingStorm">
<p><strong>Implementation Details</strong></p>
<p>The effect is included in the Storm Aura Aura effect.</p>
</section>`,
    };
  }
}
