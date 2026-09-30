import DDBEnricherData from "../data/DDBEnricherData";
import _FamiliarFeat from "./_FamiliarFeat";

/**
 * AU general feat, three ability variants collapse here. Elemental Energy imbues the familiar as
 * Find Familiar is cast: one summon per element, each giving the familiar Resistance to it. Energy
 * Pulse is the familiar's burst: a Dexterity save against the variant's ability, 2d4 of the chosen
 * element, and Prone for Medium or smaller creatures.
 */
export default class ElementalFamiliar extends _FamiliarFeat {

  static DAMAGE_TYPES = ["acid", "cold", "fire", "lightning", "thunder"];

  /** The variant's ability ("Elemental Familiar (Wisdom)"), which sets the save DC. */
  get ability(): string {
    const match = this.name.match(/\((Charisma|Intelligence|Wisdom)\)/i);
    return match ? match[1].slice(0, 3).toLowerCase() : "spellcasting";
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Energy Pulse",
      activationType: "bonus",
      activationCondition: "Your familiar, within 120 feet, takes a Reaction to unleash the burst",
      data: {
        // the emanation comes from the familiar, so no template is placed on the caster
        target: {
          override: true,
          template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" },
          affects: { count: "", type: "creature", choice: false, special: "" },
        },
        range: {
          override: true,
          units: "spec",
          special: "5-foot Emanation from your familiar",
        },
        save: {
          ability: ["dex"],
          dc: {
            calculation: this.ability,
            formula: "",
          },
        },
        damage: {
          onSave: "none",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 4,
              types: ElementalFamiliar.DAMAGE_TYPES,
            }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return _FamiliarFeat.imbuedSummons("Elemental", "elemFam", ElementalFamiliar.DAMAGE_TYPES);
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Energy Pulse: Prone",
        activityMatch: "Energy Pulse",
        statuses: ["prone"],
      },
      ..._FamiliarFeat.imbuedEffects("Elemental", ElementalFamiliar.DAMAGE_TYPES, "The familiar has"),
    ];
  }

  // the parser's Prone condition effect is replaced by one scoped to Energy Pulse, so the imbued
  // summons carry only their resistance
  override get clearAutoEffects(): boolean {
    return true;
  }

}
