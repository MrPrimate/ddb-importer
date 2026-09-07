import DDBEnricherData from "../data/DDBEnricherData";

export default class Goodberry extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Create Berries",
      targetType: "self",
      noeffect: true,
      stopHealSpellActivity: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Eat Berry",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateHealing: true,
          consumeItem: true,
          noSpellslot: true,
          noeffect: true,
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "1",
            types: ["healing"],
          }),
          activationOverride: { type: "bonus", condition: "" },
        },
        overrides: {
          targetType: "creature",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbGoodberry">
<p><strong>Implementation Details</strong></p>
<p>The Uses of this spell represent the remaining berries; casting it with the <strong>Create Berries</strong> activity conjures ten. The <strong>Eat Berry</strong> activity consumes one berry and restores 1 hit point.</p>
</section>`,
      uses: {
        max: "10",
        spent: null,
      },
    };
  }

}
