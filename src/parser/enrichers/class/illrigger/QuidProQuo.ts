import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

/**
 * The use is only spent on a successful banishment; the devil that takes the target's place is
 * left to the table.
 */
export default class QuidProQuo extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Quid Pro Quo",
      addItemConsume: true,
      activationType: "action",
      targetType: "creature",
      targetCount: 1,
      rangeType: "ft",
      rangeValue: 30,
      data: {
        duration: {
          units: "minute",
          value: "1",
        },
        save: {
          ability: ["cha"],
          dc: _Illrigger.INTERDICT_DC,
        },
      },
    };
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Banished to Hell",
        activityMatch: "Quid Pro Quo",
        options: {
          durationSeconds: 60,
          description: "Banished to the wastes of Hell. Repeat the Charisma saving throw at the end of each of your turns, ending the effect on a success. A devil jurist or horned devil takes your place as the illrigger's ally.",
        },
      },
    ];
  }

}
