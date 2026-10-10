import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Parasite Patron: the manifested weapon is a melee spell attack with reach five times your
 * proficiency bonus, dealing 1d12 of the type chosen at manifestation with no ability modifier.
 * DDB's three attack actions name the type.
 */
export default class ParasiticWeaponAttack extends DDBEnricherData {

  get damageType(): string {
    const match = (/\((bludgeoning|piercing|slashing)\)/i).exec(this.ddbParser.originalName ?? this.name ?? "");
    return match ? match[1].toLowerCase() : "bludgeoning";
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "action",
      activationCondition: "Part of the Attack action while the parasitic weapon is manifested (a bonus action to manifest)",
      data: {
        damage: {
          includeBase: false,
          parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 12, types: [this.damageType] })],
        },
        attack: {
          ability: "spellcasting",
          type: { value: "melee", classification: "spell" },
        },
        range: { override: true, units: "ft", value: "5 * @prof" },
      },
    };
  }

}
