import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Great Fool: a Charisma save against your spell save DC or one curse of your choice for a minute,
 * repeating the save at the end of each turn. Each curse is its own effect; pick the one you chose.
 */
export default class JesterJapes extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "action",
      addItemConsume: true,
      data: {
        range: { override: true, value: "60", units: "ft" },
        save: {
          ability: ["cha"],
          dc: { calculation: "spellcasting", formula: "" },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    const curse = (name: string, description: string, changes: IActiveEffectChangeData[] = [], statuses: string[] = []): IDDBEffectHint => ({
      name: `Jester Japes: ${name}`,
      statuses,
      changes,
      options: {
        durationSeconds: 60,
        description: `${description} Repeats the Charisma save at the end of each of its turns, ending the curse on a success.`,
      },
    });
    return [
      curse("Flower Spurt", "Blinded by a strange liquid.", [], ["Blinded"]),
      curse("Clown Shoes", "Speed halved, and Disadvantage on Dexterity checks and saving throws.", [
        DDBEnricherData.ChangeHelper.customChange("/2", 20, "system.attributes.movement.all"),
        DDBEnricherData.ChangeHelper.disadvantageAbilityCheckChange("dex"),
        DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange("dex"),
      ]),
      curse("Honk Honk", "Every movement is audible out to 100 feet, and the creature can't benefit from the Invisible condition."),
      curse("Jolly Arms", "Deals half damage with weapon attacks and Unarmed Strikes."),
    ];
  }

}
