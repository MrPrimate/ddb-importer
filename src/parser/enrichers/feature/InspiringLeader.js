/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class InspiringLeader extends DDBEnricherMixin {

  get type() {
    return "none";
  }

  get additionalActivities() {
    return [
      {
        action: { name: "Bolstering Performance", type: "feat", rename: ["Temp HP (Wisdom)"] },
        overrides: {
          data: {
            healing: DDBEnricherMixin.basicDamagePart({ bonus: "@details.level + @abilities.wis.mod", type: "temphp" }),
          },
        },
      },
      {
        action: { name: "Bolstering Performance", type: "feat", rename: ["Temp HP (Charisma)"] },
        overrides: {
          data: {
            healing: DDBEnricherMixin.basicDamagePart({ bonus: "@details.level + @abilities.cha.mod", type: "temphp" }),
          },
        },
      },
    ];
  }

}
