import DDBEnricherData from "../../data/DDBEnricherData";

export default class AncestralProtectors extends DDBEnricherData {

  get effects() {
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

  get itemMacro() {
    return {
      type: "feat",
      name: "ancestralProtectors.js",
    };
  }

}
