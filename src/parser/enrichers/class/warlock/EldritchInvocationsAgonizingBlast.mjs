/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class EldritchInvocationsAgonizingBlast extends DDBEnricherData {

  get type() {
    return "enchant";
  }

  get activity() {
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

  get effects() {
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

  get override() {
    return {
      data: {
        "system.prerequisites.repeatable": true,
      },
    };
  }

}
