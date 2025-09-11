/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ExceptionalTraining extends DDBEnricherData {

  get type() {
    return "enchant";
  }

  get activity() {
    return {
      type: "enchant",
      activationType: "special",
      noTemplate: true,
      targetType: "creature",
      data: {
        restrictions: {
          type: "weapon",
          allowMagical: true,
        },
      },
    };
  }

  get effects() {
    return this.is2014
      ? [
        {
          type: "enchant",
          name: "Exceptional Training",
          magicalBonus: {
            makeMagical: true,
          },
        },
      ]
      : [
        {
          type: "enchant",
          name: "Exceptional Training",
          changes: [
            DDBEnricherData.ChangeHelper.addChange("force", 20, "system.damage.base.types"),
            DDBEnricherData.ChangeHelper.overrideChange("icons/creatures/claws/claw-talons-glowing-purple.webp", 20, "img"),
          ],
        },
      ];
  }

}
