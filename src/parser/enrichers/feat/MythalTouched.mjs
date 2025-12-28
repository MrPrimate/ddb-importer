/* eslint-disable class-methods-use-this */
import { DICTIONARY } from "../../../config/_module.mjs";
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class MythalTouched extends DDBEnricherData {
  get type() {
    return "save";
  }

  get activity() {
    const modId = this.ddbParser.ddbData.character.modifiers.feat.find((mod) =>
      mod.type === "bonus"
      && mod.componentId === this.ddbParser.ddbDefinition.componentId,
    )?.entityId;

    const dictionaryMapping = DICTIONARY.actor.abilities.find((ability) =>
      ability.id === modId,
    ) ?? "int";

    const data = {
      save: {
        ability: [this.ddbParser.isMuncher ? "int" : dictionaryMapping],
      },
      range: {
        units: "spec",
      },
    };

    return {
      addItemConsume: true,
      activationType: "special",
      targetType: "creature",
      name: this.ddbParser.isMuncher
        ? "Save (Intelligence)"
        : "Save",
      data,
    };
  }

  get additionalActivities() {
    return this.ddbParser.isMuncher
      ? [
        {
          duplicate: true,
          overrides: {
            name: "Save (Wisdom)",
            data: {
              save: {
                ability: "wis",
              },
            },
          },
        },
        {
          duplicate: true,
          overrides: {
            name: "Save (Charisma)",
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
