import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Pestilent Haze Tolling Censer: a 20-foot emanation of chosen creatures makes a Constitution save
 * against your Monk save DC, taking two Martial Arts dice of Necrotic and the Miasmic Plague curse on
 * a failure, half damage on a success. DDB's action keeps its Ki / Focus cost.
 */
export default class CloudOfMiasma extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        target: {
          override: true,
          affects: { type: "creature", choice: true },
          template: { type: "radius", size: "20", units: "ft", contiguous: false },
        },
        save: {
          ability: ["con"],
          dc: { calculation: "wis", formula: "" },
        },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({ customFormula: "2d@scale.monk.die.faces", types: ["necrotic"] }),
          ],
        },
      },
    };
  }

}
