import Generic from "../Generic";

/**
 * Raging Elements options (Path of the Elements, World of Warcraft; the WoW Shaman's Elemental
 * Specialization). DDB's action resolves the dice for the character's level and adds the ability
 * modifier; the text rolls Rage Damage bonus dice with no modifier, at DC 8 + Con mod + PB for the
 * saves. The Elemental Overload activities come from DDB's actions (useDefaultAdditionalActivities).
 */
export default abstract class _RagingElements extends Generic {

  abstract get dieFaces(): number;

  abstract get damageType(): string;

  get rageDice(): string {
    return `(@scale.${this.classIdentifier("Barbarian")}.rage-damage)d${this.dieFaces}`;
  }

  get damageParts(): I5eDamagePart[] {
    return [Generic.basicDamagePart({ customFormula: this.rageDice, types: [this.damageType] })];
  }

}
