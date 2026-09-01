import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Improved Predatory Strikes reads "your hybrid form also gains the following additional benefit",
 * so its +1/+2/+3 attack bonus is baked into the level banded Predatory Strike activities on
 * Hybrid Transformation. The option modifiers are refused here rather than emitted as a rule on
 * this feature's transfer effect, which would also boost a normal form Unarmed Strike; the speed
 * bonus DDB grants the feature directly is untouched.
 */
export default class StalkersProwess extends DDBEnricherData {

  override get noSuppressedChoiceModifiers(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbStalkersProwess">
<p><strong>Implementation Details</strong></p>
<p>The Improved Predatory Strikes attack bonus is applied by the Predatory Strike activities of your Hybrid Transformation.</p>
</section>`,
    };
  }

}
