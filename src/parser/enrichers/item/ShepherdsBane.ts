import { utils } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";

export default class ShepherdsBane extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Grow Claws",
      data: {
        _id: utils.namedIDStub("shepherdsBaneClaw", { postfix: "core" }),
        restrictions: {
          type: "weapon",
          categories: ["natural"],
          allowMagical: true,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        type: "enchant",
        name: "Claws",
        activityMatch: "Grow Claws",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Claws]`, 25, "name"),
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "system.damage.base.number"),
          DDBEnricherData.ChangeHelper.overrideChange("6", 20, "system.damage.base.denomination"),
          DDBEnricherData.ChangeHelper.addChange("slashing", 20, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.addChange("-bludgeoning", 21, "system.damage.base.types"),
        ],
        options: {
          durationSeconds: 3600,
          description: "Your unarmed strikes using your claws deal 1d6 Slashing damage.",
        },
        data: {
          _id: utils.namedIDStub("shepherdsBaneCl", { prefix: "enchant", postfix: "ef" }),
        },
      },
    ];
  }

}
