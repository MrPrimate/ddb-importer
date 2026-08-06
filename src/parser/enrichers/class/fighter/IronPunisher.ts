import DDBEnricherData from "../../data/DDBEnricherData";

export default class IronPunisher extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Stance: Iron Punisher",
        ignoreTransfer: true,
        options: {
          transfer: true,
          disabled: true,
          description: "While in this stance, your melee weapon attacks have advantage, but all attacks against you also have advantage.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.mwak"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.advantage.attack.all"),
        ],
      },
    ];
  }

}
