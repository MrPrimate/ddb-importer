/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class WandOfOrcus extends DDBEnricherData {

  get addAutoAdditionalActivities() {
    return false;
  }

  get type() {
    return "attack";
  }

  get activity() {
    return {
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 12,
              types: ["necrotic"],
            }),
          ],
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Save vs Attunement",
          type: "save",
        },
        build: {
          generateSave: true,
          generateTarget: true,
          generateConsumption: false,
          generateDamage: true,
          onSave: "full",
          includeBaseDamage: false,
        },
        overrides: {
          targetType: "self",
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 10,
                  denomination: 6,
                  types: ["necrotic"],
                }),
              ],
            },
          },
        },
      },
    ];
  }

  get documentStub() {
    return {
      documentType: "weapon",
      parsingType: "weapon",
      replaceDefaultActivity: true,
      systemType: {
        value: "simpleM",
        baseItem: "mace",
      },
      copySRD: {
        name: "Mace",
        type: "weapon",
        uuid: "Compendium.dnd5e.items.Item.Ajyq6nGwF7FtLhDQ",
      },
    };
  }


}
