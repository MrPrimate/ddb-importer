import DDBEnricherData from "../data/DDBEnricherData";

/**
 * AU general feat, three ability variants collapse here. Energy Pulse is the familiar's burst: a
 * Dexterity save against the variant's ability, 2d4 of the element chosen when casting Find
 * Familiar, and Prone for Medium or smaller creatures (the parser's condition effect).
 */
export default class ElementalFamiliar extends DDBEnricherData {

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
              types: ["acid", "cold", "fire", "lightning", "thunder"],
            }),
          ],
        },
      },
    };
  }

}
