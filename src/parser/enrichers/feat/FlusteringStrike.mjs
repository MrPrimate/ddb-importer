/* eslint-disable class-methods-use-this */
import { DICTIONARY } from "../../../config/_module.mjs";
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class FlusteringStrike extends DDBEnricherData {

  get activity() {
    const data = this.ddbParser.isMuncher
      ? {
        save: {
          ability: ["dex"],
        },
      }
      : {};
    data.range = {
      units: "spec",
    };

    return {
      addItemConsume: true,
      activationType: "special",
      targetType: "enemy",
      name: this.ddbParser.isMuncher
        ? "Flustering Strike (Dexterity)"
        : "Flustering Strike",
      data,
    };
  }

  get effects() {

    const changes = DICTIONARY.actor.abilities.map((ability) => {
      return DDBEnricherData.ChangeHelper.addChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, `system.abilities.${ability.value}.save.roll.mode`);
    });
    return [
      {
        name: "Flustered",
        changes,
        daeSpecialDurations: ["turnEndSource"],
        options: {
          durationRounds: 1,
        },
      },
    ];
  }

  get additionalActivities() {
    return this.ddbParser.isMuncher
      ? [
        {
          duplicate: true,
          overrides: {
            name: "Flustering Strike (Charisma)",
            data: {
              save: {
                ability: "cha",
              },
            },
          },
        },
      ]
      : [];
  }


}
