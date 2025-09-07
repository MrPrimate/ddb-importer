/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class GreatWeaponMaster extends DDBEnricherData {

  get type() {
    if (this.is2014) return "utility";
    return null;
  }

  get activity() {
    return {
      name: "Toggle Effect",
      activationType: "Special",
      targetType: "self",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Damage",
          type: "damage",
        },
        build: {
          noeffect: true,
          generateDamage: true,
          generateTarget: true,
          generateActivation: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              bonus: this.is2014 ? "10" : "@prof",
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
        },
      },
    ];
  }

  get effects() {

    if (this.is2014) {
      return [
        {
          options: {
            transfer: true,
            disabled: true,
          },
          changes: [
            DDBEnricherData.ChangeHelper.unsignedAddChange("-5", 20, "system.bonuses.mwak.attack"),
            DDBEnricherData.ChangeHelper.unsignedAddChange("+10", 20, "system.bonuses.mwak.damage"),
          ],
          data: {
            flags: {
              dae: {
                showIcon: true,
              },
            },
          },
        },
      ];
    } else {
      return [];
    }

  }

  get override() {
    const description = this.is2014
      ? `
<section class="secret ddbSecret" id="secret-ddbGreatWeaponMaster">
<p><strong>Implementation Details</strong></p>

An effect is provided that can be toggled to enable or disable the Melee Weapon attack penalty and damage bonus.

</section>`
      : `
<section class="secret ddbSecret" id="secret-ddbGreatWeaponMaster">
<p><strong>Implementation Details</strong></p>
<p>DDB Importer will automated the proficiency bonus damage for weapons with the Heavy property if you have this feat. A damage action is provided for situations where this might not be applied.</p>
</section>`;
    return {
      descriptionSuffix: description,
      data: {
        flags: {
          "midi-qol": {
            effectActivation: false,
            removeAttackDamageButtons: false,
          },
          midiProperties: {
            toggleEffect: true,
          },
        },
      },
    };
  }

}
