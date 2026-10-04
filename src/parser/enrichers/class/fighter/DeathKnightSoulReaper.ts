import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Barrow Guard Soul Reaper: forgo an attack and spend a Draugr Die (Death Knight's uses): a creature
 * within 60 feet makes a Strength save (8 + Constitution + proficiency) or takes the die plus your
 * Constitution modifier as Necrotic and is Grappled for a minute; half damage on a success. The
 * Grappled status comes from DDB's own condition effect.
 */
export default class DeathKnightSoulReaper extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      noTemplate: true,
      activationType: "special",
      activationCondition: "You forgo one attack of your Attack action",
      addItemConsume: true,
      itemConsumeTargetName: "death-knight",
      data: {
        range: { override: true, value: "60", units: "ft" },
        save: {
          ability: ["str"],
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
