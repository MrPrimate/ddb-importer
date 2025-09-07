/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class WardingBond extends DDBEnricherData {

  get type() {
    return "ddbmacro";
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

  get override() {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbHeroesFeast">
<p><strong>Implementation Details</strong></p>
<p>The DDB Macro Activity will apply an automation that will apply damage taken by the target to the caster. You can disable this automation in the settings.</p>
</section>`,
    };
  }

  get effects() {
    const damageChanges = DDBEnricherData.allDamageTypes().map((type) => {
      return DDBEnricherData.ChangeHelper.unsignedAddChange(type, 0, "system.traits.dr.value");
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
