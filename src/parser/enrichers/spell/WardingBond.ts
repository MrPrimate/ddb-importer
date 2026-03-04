import DDBEnricherData from "../data/DDBEnricherData";

export default class WardingBond extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DDBMACRO;
  }

  get activity() {
    return {
      name: "Warding Bond",
      data: {
        name: "Apply Warding Bond",
        macro: {
          name: "Warding Bond Macro",
          function: "ddb.spell.wardingBond",
          visible: false,
          parameters: "",
        },
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbHeroesFeast">
<p><strong>Implementation Details</strong></p>
<p>The DDB Macro Activity will apply an automation that will apply damage taken by the target to the caster. You can disable this automation in the settings.</p>
</section>`,
    };
  }

  get effects(): IDDBEffectHint[] {
    const damageChanges = DDBEnricherData.allDamageTypes().map((type) => {
      return DDBEnricherData.ChangeHelper.damageResistanceChange(type, 0);
    });
    return [{
      changes: [
        ...damageChanges,
        DDBEnricherData.ChangeHelper.signedAddChange("1", 20, "system.attributes.ac.bonus"),
        DDBEnricherData.ChangeHelper.signedAddChange("1", 20, "system.bonuses.abilities.save"),
      ],
    }];
  }

}
