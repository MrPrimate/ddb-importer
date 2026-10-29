import DDBEnricherData from "../../data/DDBEnricherData";
import { parseDamageRules } from "./_DamageRuleText";

interface IParsedAction {
  html?: string;
  strippedHtml?: string;
}

/**
 * Monster text that lets its damage ignore resistance or immunity, or treat immunity as
 * resistance, as dnd5e 6.1 damage application rules on a passive effect. A trait covering all the
 * monster deals ("Fire damage dealt by the jurist ignores damage resistance") applies to every roll
 * it makes, optionally only its spells or weapon attacks; a clause on an action ("This damage
 * ignores Resistance and Immunity") is scoped to rolls made with that action. The activities are
 * left as the parser built them, and text with no such clause changes nothing.
 */
export default class IgnoreDamageResistance extends DDBEnricherData {

  get text(): string {
    const parser = (this.ddbParser ?? {}) as IParsedAction;
    return parser.strippedHtml ?? parser.html ?? "";
  }

  override get effects(): IDDBEffectHint[] {
    const clauses = parseDamageRules(this.text, DDBEnricherData.allDamageTypes());
    const changes = clauses.flatMap((clause) => {
      const conditions: IEffectChangeFilter[] = [];
      if (clause.scope === "self") conditions.push(this.selfIdentifierFilter);
      if (clause.spellsOnly) conditions.push(DDBEnricherData.ChangeHelper.SPELL_FILTER);
      if (clause.weaponAttacksOnly) conditions.push(DDBEnricherData.ChangeHelper.WEAPON_ATTACK_FILTER);
      const options = conditions.length > 0 ? { conditions } : {};
      return clause.rules.flatMap((rule) =>
        DDBEnricherData.ChangeHelper.damageApplicationChanges(rule, clause.types, options));
    });
    return DDBEnricherData.damageRuleEffect(this.data.name, changes);
  }

}
