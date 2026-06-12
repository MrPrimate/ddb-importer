import DDBEnricherData from "../data/DDBEnricherData";

export default abstract class TomeOf extends DDBEnricherData {

  abstract effectData;

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Read Tome",
      addItemConsume: true,
      targetType: "self",
      activationType: "special",
      itemConsumeValue: "1",
      addScalingMode: "amount",
      addConsumptionScalingMax: "@item.uses.value",
    };
  }

  get effects(): IDDBEffectHint[] {
    const effectData = this.effectData;

    return [
      {
        noCreate: true,
        name: effectData.name,
        changesOverwrite: true,
        changes: [
          DDBEnricherData.ChangeHelper.addChange("2", "5", `system.abilities.${effectData.ability}.value`),
          DDBEnricherData.ChangeHelper.addChange("2", "1", `system.abilities.${effectData.ability}.max`),
        ],
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      retainResourceConsumption: true,
      retainUseSpent: true,
      uses: {
        spent: null,
        max: "48",
        recovery: [],
        autoDestroy: false,
      },
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbTomeOf">
<p><strong>Implementation Details</strong></p>
<p>Track your reading time with the uses on this feature. When the item is equipped it will apply the bonus, this is to match the DDB implementation.</p>
</section>`,
    };
  }

}
