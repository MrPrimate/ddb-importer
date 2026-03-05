import DDBEnricherData from "../../data/DDBEnricherData";

export default class VowOfEnmity extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Activate Vow",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      addItemConsume: true,
      activationType: "special",
      activationCondition: "Take the attack action",
      targetType: "creature",
      data: {
        range: {
          units: "ft",
          value: 30,
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [{
      name: "Vow of Enmity",
      options: {
        description: "You gain advantage on attack rolls against the creature",
        durationSeconds: 60,
      },
      // midiChanges: [
      //   DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all"),
      // ],
    }];
  }


}
