import DDBEnricherData from "../data/DDBEnricherData";

export default class InspiringLeader extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: { name: "Bolstering Performance", type: "feat", rename: ["Temp HP (Wisdom)"] },
        overrides: {
          data: {
            healing: DDBEnricherData.basicDamagePart({ bonus: "@details.level + @abilities.wis.mod", type: "temphp" }),
          },
        },
      },
      {
        action: { name: "Bolstering Performance", type: "feat", rename: ["Temp HP (Charisma)"] },
        overrides: {
          data: {
            healing: DDBEnricherData.basicDamagePart({ bonus: "@details.level + @abilities.cha.mod", type: "temphp" }),
          },
        },
      },
    ];
  }

}
