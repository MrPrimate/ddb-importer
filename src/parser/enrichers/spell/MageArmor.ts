import DDBEnricherData from "../data/DDBEnricherData";

export default class MageArmor extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("mage", 5, "system.attributes.ac.calc"),
        ],
        data: {
          img: "icons/equipment/chest/breastplate-helmet-metal.webp",
        },
      },
    ];
  }

}
