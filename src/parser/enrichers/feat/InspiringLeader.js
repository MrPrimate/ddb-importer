/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class InspiringLeader extends DDBEnricherMixin {

  get type() {
    return "none";
  }

  get additionalActivities() {
    console.warn("additional activities for Inspiring Leader", {
      this: this,
    });
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