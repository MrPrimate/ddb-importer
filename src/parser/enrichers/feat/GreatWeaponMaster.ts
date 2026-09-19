import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Great Weapon Master. Neither ruleset changes a die result, so nothing here belongs on
 * `DamageData.modifiers`; both rulesets are flat numbers and ride on conditioned dnd5e rule changes
 * scoped to Heavy weapons. 2014 is an opt-in trade (-5 to hit, +10 damage), 2024 adds proficiency
 * bonus damage, and both effects ship disabled because the rule cannot see the player's choice or
 * whose turn it is.
 */
export default class GreatWeaponMaster extends DDBEnricherData {

  /** 2014 wording: "a melee attack with a heavy weapon". */
  static get HEAVY_MELEE_WEAPON_FILTER(): IEffectChangeFilter[] {
    return [
      ...DDBEnricherData.ChangeHelper.MELEE_WEAPON_ATTACK_FILTER,
      { k: "item.properties", o: "has", v: "hvy" },
    ];
  }

  override get type(): IDDBActivityType | null {
    if (this.is2014) return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
    return null;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Toggle Effect",
      activationType: "special",
      targetType: "self",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
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

  override get effects(): IDDBEffectHint[] {

    if (this.is2014) {
      return [
        {
          options: {
            transfer: true,
            disabled: true,
            showIcon: 2,
          },
          changes: [
            DDBEnricherData.ChangeHelper.ruleBonusChange("attack", "-5", {
              conditions: GreatWeaponMaster.HEAVY_MELEE_WEAPON_FILTER,
            }),
            DDBEnricherData.ChangeHelper.ruleBonusChange("damage", "10", {
              conditions: GreatWeaponMaster.HEAVY_MELEE_WEAPON_FILTER,
            }),
          ],
        },
      ];
    } else {
      return [
        {
          name: "Great Weapon Master: Heavy Weapon Mastery",
          options: {
            transfer: true,
            disabled: true,
            description: "Adds your Proficiency Bonus to the damage of a hit with a Heavy weapon. The rule cannot see whether the hit came from the Attack action on your turn, so enable/disable as required.",
          },
          changes: [
            DDBEnricherData.ChangeHelper.ruleBonusChange("damage", "@prof", {
              conditions: [
                { k: "roll.attack.classification", o: "exact", v: "weapon" },
                { k: "item.properties", o: "has", v: "hvy" },
              ],
            }),
          ],
        },
      ];
    }
  }

  override get override(): IDDBOverrideData {
    const description = this.is2014
      ? `
<section class="secret ddbSecret" id="secret-ddbGreatWeaponMaster">
<p><strong>Implementation Details</strong></p>

<p>An effect is provided that can be toggled to enable or disable the attack penalty and damage bonus. While enabled it applies to melee attacks made with a Heavy weapon only.</p>

</section>`
      : `
<section class="secret ddbSecret" id="secret-ddbGreatWeaponMaster">
<p><strong>Implementation Details</strong></p>
<p>DDB Importer can add the Proficiency Bonus damage on Heavy weapon hits through toggling the feat's effect (any weapon attack with a Heavy weapon; the Attack-action-on-your-turn clause is not checked). The Damage action is a manual fallback for tables that disable that effect; using both applies the bonus twice.</p>
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
