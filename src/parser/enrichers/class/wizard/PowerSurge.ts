import DDBEnricherData from "../../data/DDBEnricherData";

export default class PowerSurge extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Gain Power Surge",
      addItemConsume: true,
      itemConsumeValue: "-1",
      data: {

      },
    };
  }

  override get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Power Surge",
      max: "max(1, @abilities.int.mod)",
    });

    // uses are inverted here
    uses.spent = Math.max((foundry.utils.getProperty(this.ddbParser.ddbCharacter ?? {}, "abilities.withEffects.int.mod") as number) - (uses.spent ?? 0), 0);
    uses.recovery = [
      { "period": "lr", "type": "formula", "formula": "1 - @item.uses.value" },
    ];
    return {
      retainResourceConsumption: true,
      retainUseSpent: true,
      uses,
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbPowerSurge">
<p><strong>Implementation Details</strong></p>
<p>Track your Power Uses with the uses on this feature. DDB Importer initially draws them from the "Power Surge" action on DDB. It will retain your current uses on the character reimport.</p>
</section>`,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Power Surge (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional once per turn extra damage when you damage a creature with a wizard spell, spending one power surge from this feature's uses.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=floor(@classes.wizard.levels / 2)[force]; usesCount=origin; oncePerTurn; optin; isSpell && item.classIdentifier === 'wizard'",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Bonus Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
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
