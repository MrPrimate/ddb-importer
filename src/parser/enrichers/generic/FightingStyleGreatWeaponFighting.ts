import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Great Weapon Fighting, as the 2014 Fighting Style option and the 2024 Fighting Style feat.
 *
 */
export default class FightingStyleGreatWeaponFighting extends DDBEnricherData {

  /**
   * 2014 rerolls a 1 or 2 once; 2024 treats a 1 or 2 as a 3.
   * @returns {string} the Foundry dice modifier for this ruleset
   */
  get dieModifier(): string {
    return this.is2014 ? "r<=2" : "min3";
  }

  // a passive rider on weapon damage, nothing to activate
  override get stopDefaultActivity(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Great Weapon Fighting",
        ac5eOnly: true,
        options: {
          transfer: true,
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            `modifier=${this.dieModifier};twoHanded && mwak`,
            20,
            "flags.automated-conditions-5e.damage.modifier",
          ),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbGreatWeaponFighting">
<p><strong>Implementation Details</strong></p>
<p>With Automated Conditions 5e installed, the feature's effect applies <code>${this.dieModifier}</code> to the damage dice of melee weapon attacks made two-handed. Without it, DDB Importer adds the modifier to the damage dice of your Two-Handed weapons and to the versatile damage of your Versatile weapons when the character is imported.</p>
</section>`,
    };
  }

}
