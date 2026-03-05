import DDBEnricherData from "../../data/DDBEnricherData";

export default class EldritchInvocationsAgonizingBlast extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      data: {
        restrictions: {
          type: "spell",
          allowMagical: true,
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Agonizing Blast",
        type: "enchant",
        ignoreTransfer: true,
        options: {
          transfer: true,
          disabled: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Agonizing]`, 10, "name"),
          DDBEnricherData.ChangeHelper.addChange("@abilities.cha.mod", 20, "system.damage.bonus"),
        ],
      },
    ];
  }

  get override(): IDDBOverrideData {
    const name = this.ddbParser.isMuncher
      ? this.name.split("(")[0].trim()
      : this.name;
    return {
      data: {
        name,
        "system.prerequisites.repeatable": true,
        flags: {
          ddbimporter: {
            originalName: name,
          },
        },
      },
    };
  }

}
