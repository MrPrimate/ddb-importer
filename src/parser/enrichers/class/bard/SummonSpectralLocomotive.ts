import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * College of Whistles Ride the Rails: a 120-foot by 10-foot line from you. Creatures in it make a
 * Wisdom save against your spell save DC or are Deafened until the start of your next turn, pushed
 * 10 feet and take Psychic damage of three Bardic Inspiration dice; you and up to six willing
 * creatures teleport along the line.
 */
export default class SummonSpectralLocomotive extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "action",
      addItemConsume: true,
      data: {
        range: { override: true, units: "self" },
        target: {
          override: true,
          affects: { type: "creature" },
          template: { type: "line", size: "120", width: "10", units: "ft", contiguous: false },
        },
        save: {
          ability: ["wis"],
          dc: { calculation: "spellcasting", formula: "" },
        },
        damage: {
          onSave: "none",
          parts: [
            DDBEnricherData.basicDamagePart({ customFormula: "3d@scale.bard.inspiration.faces", types: ["psychic"] }),
          ],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Ride the Rails: Deafened",
        statuses: ["Deafened"],
        options: { durationSeconds: 6, description: "Deafened until the start of the bard's next turn, and pushed up to 10 feet away from the line's origin." },
      },
    ];
  }

}
