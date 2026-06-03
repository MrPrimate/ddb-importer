import DDBEnricherData from "../../data/DDBEnricherData";

export default class DeftExplorer extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Tireless (Level 10)",
      targetType: "self",
      activationType: "action",
      addActivityConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "1d8 + @abilities.wis.mod", // "@classes.artificer.levels * 2",
          types: ["temphp"],
        }),
        uses: {
          max: "@prof",
          spent: 0,
          recovery: [{ period: "lr", type: "recoverAll", formula: undefined }],
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Roving",
        changes: [
          DDBEnricherData.ChangeHelper.addChange("5", 10, "system.attributes.movement.walk"),
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.climb"),
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.swim"),
        ],
        options: {
          transfer: true,
          enabled: !this.ddbParser.isMuncher && this.ddbParser._class.level >= 6,
        },
        data: {
          flags: {
            ddbimporter: {
              effectIdLevel: {
                min: 5,
                max: null,
              },
            },
          },
        },
      },
    ];
  }

}
