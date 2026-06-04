import DDBEnricherData from "../../data/DDBEnricherData";

export default class StrangeModifications extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Strange Modification: Arcane Conduit",
      targetType: "creature",
      activationType: "special",
      addActivityConsume: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@abilities.int.mod",
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
          critical: {
            allow: true,
          },
          uses: {
            spent: 0,
            max: "1",
            recovery: [{ period: "turnStart", type: "recoverAll", formula: undefined }],
          },
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Strange Modification: Ferocity",
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
        },
        build: {
          generateActivation: true,
          generateDamage: false,
        },
        overrides: {
          data: {
            restrictions: {
              allowMagical: true,
            },
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        type: "enchant",
        name: "Strange Modification: Ferocity",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Ferocity]`, 20, "name"),
          DDBEnricherData.ChangeHelper.upgradeChange(`[["1d6[necrotic]", "necrotic"]]`, 20, "system.damage.parts"),
        ],
        activityMatch: "Strange Modification: Ferocity",
      },
    ];
  }

}
