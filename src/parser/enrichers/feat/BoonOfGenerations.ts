import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Both benefits (Feed Die reroll on 1s, +5 Blood Point maximum) are passive;
 * the DDB actions would otherwise attach as junk activities. The reroll lives on
 * the Feed feature, whose enricher rolls its Feed Dice with `r1` when the
 * character has this boon. The Blood Point maximum increase is not automated -
 * adjust the Blood Potency pool manually.
 */
export default class BoonOfGenerations extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbBoonOfGenerations">
<p><strong>Implementation Details</strong></p>
<p>Deep Feeding is applied on the Feed feature, whose Feed Dice reroll a 1 once (<code>r1</code>). The Blood Point maximum increase is not automated.</p>
</section>`,
    };
  }

}
