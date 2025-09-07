/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class TomeOf extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
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

  get effects() {
    const effectData = this.effectData;

    return [
      {
        noCreate: true,
        name: effectData.name,
        daeOnly: true,
        changesOverwrite: true,
        // options: {
        //   transfer: false,
        // },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`min(@abilities.${effectData.ability}.max, @abilities.${effectData.ability}.value + 2)`, '5', `system.abilities.${effectData.ability}.value`),
          DDBEnricherData.ChangeHelper.addChange("2", "1", `system.abilities.${effectData.ability}.max`),
        ],
      },
      {
        noCreate: true,
        name: effectData.name,
        daeNever: true,
        changesOverwrite: true,
        // options: {
        //   transfer: false,
        // },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("2", '5', `system.abilities.${effectData.ability}.value`),
          DDBEnricherData.ChangeHelper.addChange("2", "1", `system.abilities.${effectData.ability}.max`),
        ],
      },
    ];
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter": {
          retainResourceConsumption: true,
          retainUseSpent: true,
        },
        "system.uses": {
          spent: null,
          max: "48",
          recovery: [],
          autoDestroy: false,
          autoUse: true,
        },
      },
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbTomeOf">
<p><strong>Implementation Details</strong></p>
<p>Track your reading time with the uses on this feature. When the item is equipped it will apply the bonus, this is to match the DDB implementation.</p>
</section>`,
    };
  }

}
