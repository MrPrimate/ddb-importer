import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Both benefits (Feed Die reroll on 1s, +5 Blood Point maximum) are passive;
 * the DDB actions would otherwise attach as junk activities. The reroll lives on
 * the Feed feature, whose enricher rolls its Feed Dice with `r1` when the
 * character has this boon. The +5 Blood Point maximum is an effect on the Kindred
 * Blood Points scale value, which the Blood Potency pool reads as its maximum.
 */
export default class BoonOfGenerations extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Boon of Generations",
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("5", 20, "system.scale.kindred.blood-points.value"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      // DDB ships the increase as a limited use on the junk action, which is not a pool to spend
      uses: {
        spent: null,
        max: null,
        recovery: [],
      },
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbBoonOfGenerations">
<p><strong>Implementation Details</strong></p>
<p>Deep Feeding is applied on the Feed feature, whose Feed Dice reroll a 1 once (<code>r1</code>). The Blood Point maximum increase is an effect on the Kindred Blood Points scale value.</p>
</section>`,
    };
  }

}
