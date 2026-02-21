import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityWatchersWill extends DDBEnricherData {

  /**
   * @returns {DDBActivityData}
   */
  get activity() {
    return {
      type: "utility",
      name: "Activate Watcher's Will",
      targetType: "ally",
      addItemConsume: true,
      data: {
        duration: {
          units: "minute",
          value: "1",
        },
      },
    };
  }

  /**
   * @returns {DDBEffectHint[]}
   */
  get effects() {
    return [{
      name: "Watcher's Will",
      options: {
        durationSeconds: 60,
      },
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.int.save.roll.mode"),
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.wis.save.roll.mode"),
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.cha.save.roll.mode"),
      ],
    }];
  }

}
