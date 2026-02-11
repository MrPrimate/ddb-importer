/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PowerSurge extends DDBEnricherData {

  get activity() {
    return {
      name: "Gain Power Surge",
      addItemConsume: true,
      itemConsumeValue: "-1",
      data: {

      },
    };
  }

  get override() {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Power Surge",
      max: "max(1, @abilities.int.mod)",
    });

    // uses are inverted here
    uses.spent = Math.max(this.ddbParser.ddbCharacter.abilities.withEffects.int.mod - uses.spent, 0);
    uses.recovery = [
      { "period": "lr", "type": "formula", "formula": "1 - @item.uses.value" },
    ];
    return {
      data: {
        "system.uses": uses,
        "flags.ddbimporter": {
          retainResourceConsumption: true,
          retainUseSpent: true,
        },
      },
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbPowerSurge">
<p><strong>Implementation Details</strong></p>
<p>Track your Power Uses with the uses on this feature. DDB Importer initially draws them from the "Power Surge" action on DDB. It will retain your current uses on the character reimport.</p>
</section>`,
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Bonus Damage",
          type: "damage",
        },
        build: {
          noeffect: true,
          generateConsumption: true,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          generateDamage: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "Once per turn",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "floor(@classes.wizard.level / 2)",
              types: ["force"],
            }),
          ],
        },
      },
    ];
  }


}
