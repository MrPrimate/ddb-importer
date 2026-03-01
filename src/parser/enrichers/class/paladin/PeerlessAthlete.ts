import DDBEnricherData from "../../data/DDBEnricherData";

export default class PeerlessAthlete extends DDBEnricherData {

  get activity() {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      name: "Activate Peerless Athlete",
      addItemConsume: true,
      data: {
        duration: {
          units: "hour",
          value: "1",
        },
      },
    };
  }

  get effects() {
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
