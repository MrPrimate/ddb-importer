import DDBEnricherData from "../data/DDBEnricherData";

export default class MageArmor extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.acCalcsAddChange("mage", 5),
        ],
        data: {
          img: "icons/equipment/chest/breastplate-helmet-metal.webp",
        },
      },
    ];
  }

}
