import { DICTIONARY } from "../../../config/_module";
import DDBEnricherData from "../data/DDBEnricherData";

export default class FlusteringStrike extends DDBEnricherData {

  get activity(): IDDBActivityData {
    const data: Partial<I5eActivity> = this.ddbParser.isMuncher
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

  get effects(): IDDBEffectHint[] {

    const changes = DICTIONARY.actor.abilities.map((ability) => {
      return DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange(ability.value);
    });
    return [
      {
        name: "Flustered",
        changes,
        daeSpecialDurations: ["turnEndSource" as const],
        options: {
          durationRounds: 1,
        },
      },
    ];
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return this.ddbParser.isMuncher
      ? [
        {
          duplicate: true,
          overrides: {
            name: "Flustering Strike (Charisma)",
            data: {
              save: {
                ability: ["cha"],
              },
            },
          },
        },
      ]
      : [];
  }


}
