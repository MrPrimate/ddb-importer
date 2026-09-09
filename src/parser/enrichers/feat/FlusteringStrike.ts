import { DICTIONARY } from "../../../config/_module";
import DDBEnricherData from "../data/DDBEnricherData";

export default class FlusteringStrike extends DDBEnricherData {

  override get activity(): IDDBActivityData {
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

  override get effects(): IDDBEffectHint[] {

    const changes = DICTIONARY.actor.abilities.map((ability) => {
      return DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange(ability.value);
    });
    return [
      {
        name: "Flustered",
        changes,
        options: {
          expiry: "sourceEnd",
        },
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
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
