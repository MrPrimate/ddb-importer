import DDBEnricherData from "../data/DDBEnricherData";

export default class InspiringLeader extends DDBEnricherData {

  get type() {
    return "none";
  }

  get additionalActivities() {
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
