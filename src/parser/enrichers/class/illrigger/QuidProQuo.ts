import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

/**
 * The use is only spent on a successful banishment, but the activity spends it on every use, so a
 * target that saves needs its use restored by hand (noted in the description). The devil that
 * takes the target's place is left to the table.
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

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbQuidProQuo">
<p><strong>Implementation Details</strong></p>
<p>Using the activity spends the use. If the target succeeds on its saving throw, restore the use.</p>
</section>`,
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
