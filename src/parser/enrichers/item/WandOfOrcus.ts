import DDBEnricherData from "../data/DDBEnricherData";

export default class WandOfOrcus extends DDBEnricherData {

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
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

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save vs Attunement",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
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

  override get documentStub(): IDDBDocumentStub {
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
