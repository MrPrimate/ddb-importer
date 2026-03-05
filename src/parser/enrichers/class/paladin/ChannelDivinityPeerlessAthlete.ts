import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityPeerlessAthlete extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      name: "Activate Peerless Athlete",
      addItemConsume: true,
      data: {
        duration: {
          units: "minute",
          value: "10",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [{
      name: "Peerless Athlete",
      options: {
        durationSeconds: 3600,
        description: "Advantage on Strength (Athletics) and Dexterity (Acrobatics) checks, and the distance of your Long and High Jumps increases by 10 feet",
      },
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.skills.ath.roll.mode"),
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.skills.acr.roll.mode"),
      ],
    }];
  }

}
