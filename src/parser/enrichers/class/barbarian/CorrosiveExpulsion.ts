import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Path of the Experiment compound: one attack becomes a 15-foot cone or a 30-foot line of acid, a
 * Dexterity save (8 + Constitution + proficiency) for a number of d8s equal to the Rage Damage bonus,
 * half on a success. DDB's two actions ("Corrosive Expulsion: Cone"/"Line") carry the shape.
 */
export default class CorrosiveExpulsion extends DDBEnricherData {

  get isLine(): boolean {
    return (/line/i).test(this.ddbParser.originalName);
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      activationCondition: "Replace one attack of your Attack action while the compound is active",
      data: {
        range: { override: true, units: "self" },
        target: {
          override: true,
          affects: { type: "creature" },
          template: this.isLine
            ? { type: "line", size: "30", width: "5", units: "ft", contiguous: false }
            : { type: "cone", size: "15", units: "ft", contiguous: false },
        },
        save: {
          ability: ["dex"],
          dc: { calculation: "", formula: "8 + @abilities.con.mod + @prof" },
        },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({ customFormula: "(@scale.barbarian.rage-damage)d8", types: ["acid"] }),
          ],
        },
      },
    };
  }

}
