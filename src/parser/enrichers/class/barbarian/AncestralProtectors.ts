import DDBEnricherData from "../../data/DDBEnricherData";

export default class AncestralProtectors extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
        },
        macroChanges: [
          { macroValues: `${this.data.name}`, macroType: "feat", macroName: "ancestralProtectors.js" },
        ],
      },
    ];
  }

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "feat",
      name: "ancestralProtectors.js",
    };
  }

}
