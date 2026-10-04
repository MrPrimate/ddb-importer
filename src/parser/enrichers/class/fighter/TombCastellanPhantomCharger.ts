import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Barrow Guard Phantom Charger: when the ghostly steed Dashes, Disengages or Dodges, spend a Draugr
 * Die to teleport it up to 60 feet; creatures of your choice within 10 feet of where it appears make
 * a Constitution save (8 + Constitution + proficiency) against the die plus your Constitution
 * modifier as Necrotic, half on a success.
 */
export default class TombCastellanPhantomCharger extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      activationCondition: "Your steed takes the Dash, Disengage or Dodge action",
      addItemConsume: true,
      itemConsumeTargetName: "death-knight",
      data: {
        range: { override: true, value: "60", units: "ft" },
        target: {
          override: true,
          affects: { type: "creature", choice: true },
          template: { type: "radius", size: "10", units: "ft", contiguous: false },
        },
        save: {
          ability: ["con"],
          dc: { calculation: "", formula: "8 + @abilities.con.mod + @prof" },
        },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({ customFormula: "@scale.barrow-guard.death-knight + @abilities.con.mod", types: ["necrotic"] }),
          ],
        },
      },
    };
  }

}
