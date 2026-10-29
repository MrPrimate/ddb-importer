import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The vorpal weapons (Vorpal Sword and DDB's per-weapon 2024 copies) and Snicker-Snack: the weapon
 * ignores resistance to slashing damage, a dnd5e 6.1 damage rule scoped to rolls made with it.
 */
export default class VorpalSword extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return DDBEnricherData.damageRuleEffect(
      `${this.data.name}: Ignore Slashing Resistance`,
      DDBEnricherData.ChangeHelper.ignoreResistanceChanges("slashing", { conditions: this.selfIdentifierFilter }),
    );
  }

}
