import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

export default class IronGaol extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Iron Gaol",
      ..._Illrigger.sealConsume(4),
      activationType: "action",
      targetType: "creature",
      targetCount: 1,
      data: {
        range: {
          units: "touch",
          value: "",
        },
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

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Iron Gaol",
        activityMatch: "Iron Gaol",
        options: {
          durationSeconds: 60,
          description: "Imprisoned in Hell. A creature native to Hell or of level or challenge rating 4 or lower stays there; otherwise it returns after 1 minute and repeats the saving throw at the end of each of its turns, ending the effect on a success.",
        },
      },
    ];
  }

}
