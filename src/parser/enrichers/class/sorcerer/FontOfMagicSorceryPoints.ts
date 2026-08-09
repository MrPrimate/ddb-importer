import DDBEnricherData from "../../data/DDBEnricherData";

export default class FontOfMagicSorceryPoints extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DDBMACRO;
  }

  override get activity(): IDDBActivityData {
    return {
      noConsumeTargets: true,
      data: {
        name: "Convert Sorcery Points/Spell Slots",
        macro: {
          name: "Conversion Macro",
          function: "ddb.feat.fontOfMagic",
          visible: false,
          parameters: "",
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        "name": "Sorcery Points",
        "system.identifier": "sorcery-points",
      },
    };
  }

  override get identifier(): string | null {
    return "sorcery-points";
  }

}
