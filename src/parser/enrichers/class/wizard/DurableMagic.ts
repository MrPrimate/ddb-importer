import DDBEnricherData from "../../data/DDBEnricherData";

export default class DurableMagic extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.rolls.ability.save.bonus"),
        ],
        options: {
          description: "Whilst concentrating on a spell.",
          transfer: true,
          disabled: true,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbDurableMagic">
<p><strong>Implementation Details</strong></p>
<p>An effect has been created that can be toggled when concentrating on a spell.</p>
</section>`,
    };
  }

}
