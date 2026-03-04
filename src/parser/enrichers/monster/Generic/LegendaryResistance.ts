import DDBEnricherData from "../../data/DDBEnricherData";

export default class LegendaryResistance extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
        },
        name: "Legendary Resistance",
        midiOnly: true,
        midiOptionalChanges: [{
          name: "LegRes",
          data: {
            "save.fail.all": "success",
            count: "@resources.legres.value",
            label: "Use Legendary Resistance to Succeed?",
          },
        }],
      },
    ];
  }

}
