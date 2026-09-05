import { SRD_EFFECTS, SRD_EFFECTS_PACK } from "../../../config/dictionary/effects/srdEffects";

type TSRDCategory = keyof typeof SRD_EFFECTS;
type TSRDKey<C extends TSRDCategory> = keyof (typeof SRD_EFFECTS)[C] & string;

/**
 * Typed access to the stock ActiveEffects in the dnd5e `effects` compendium, for use
 * wherever an enricher wants a compendium effect UUID (region `applyActiveEffect`
 * behaviors, activity effect links).
 */
export default class SRDEffects {

  static get PACK(): string {
    return SRD_EFFECTS_PACK;
  }

  static uuid<C extends TSRDCategory>(category: C, key: TSRDKey<C>): string {
    const entry = (SRD_EFFECTS[category] as Record<string, { id: string; name: string }>)[key];
    if (!entry) throw new Error(`Unknown SRD effect ${category}.${key}`);
    return `Compendium.${SRD_EFFECTS_PACK}.ActiveEffect.${entry.id}`;
  }

  static condition(status: TSRDKey<"conditions">): string {
    return SRDEffects.uuid("conditions", status);
  }

  static conditionImmunity(status: TSRDKey<"conditionImmunities">): string {
    return SRDEffects.uuid("conditionImmunities", status);
  }

  static damageResistance(type: TSRDKey<"damageResistances">): string {
    return SRDEffects.uuid("damageResistances", type);
  }

  static damageImmunity(type: TSRDKey<"damageImmunities">): string {
    return SRDEffects.uuid("damageImmunities", type);
  }

  static damageVulnerability(type: TSRDKey<"damageVulnerabilities">): string {
    return SRDEffects.uuid("damageVulnerabilities", type);
  }

  static checkAdvantage(ability: TSRDKey<"checkAdvantage">): string {
    return SRDEffects.uuid("checkAdvantage", ability);
  }

  static checkDisadvantage(ability: TSRDKey<"checkDisadvantage">): string {
    return SRDEffects.uuid("checkDisadvantage", ability);
  }

  static saveAdvantage(ability: TSRDKey<"saveAdvantage">): string {
    return SRDEffects.uuid("saveAdvantage", ability);
  }

  static saveDisadvantage(ability: TSRDKey<"saveDisadvantage">): string {
    return SRDEffects.uuid("saveDisadvantage", ability);
  }

  static checkAndSaveAdvantage(ability: TSRDKey<"checkAndSaveAdvantage">): string {
    return SRDEffects.uuid("checkAndSaveAdvantage", ability);
  }

  static checkAndSaveDisadvantage(ability: TSRDKey<"checkAndSaveDisadvantage">): string {
    return SRDEffects.uuid("checkAndSaveDisadvantage", ability);
  }

  static skillAdvantage(skill: TSRDKey<"skillAdvantage">): string {
    return SRDEffects.uuid("skillAdvantage", skill);
  }

  static skillDisadvantage(skill: TSRDKey<"skillDisadvantage">): string {
    return SRDEffects.uuid("skillDisadvantage", skill);
  }

  static speed(type: TSRDKey<"speeds">): string {
    return SRDEffects.uuid("speeds", type);
  }

  /** Spell-specific effects shipped in the dnd5e `effects` pack since 6.0 (Silenced, Aura of Life). */
  static spell(key: TSRDKey<"spells">): string {
    return SRDEffects.uuid("spells", key);
  }

  static isSRDUuid(uuid: string): boolean {
    return uuid.startsWith(`Compendium.${SRD_EFFECTS_PACK}.ActiveEffect.`);
  }

  /** The stock effect's name for an SRD uuid, e.g. "Silenced"; null for anything else. */
  static name(uuid: string): string | null {
    if (!SRDEffects.isSRDUuid(uuid)) return null;
    const id = uuid.split(".").pop();
    for (const entries of Object.values(SRD_EFFECTS)) {
      const match = Object.values(entries as Record<string, { id: string; name: string }>).find((e) => e.id === id);
      if (match) return match.name;
    }
    return null;
  }

  /** Human readable label for an SRD effect uuid, e.g. "SRD:Silenced"; unknown uuids come back unchanged. */
  static describe(uuid: string): string {
    const name = SRDEffects.name(uuid);
    return name ? `SRD:${name}` : uuid;
  }

}
