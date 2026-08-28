import DDBEnricherData from "../data/DDBEnricherData";

/**
 * A thrown orb that fills a 20 ft radius sphere for 1d4 rounds; each creature
 * that starts its turn in it or enters it on its turn saves against falling
 * Unconscious for 1 minute, and the effect ends early if the creature takes
 * damage. DDB parses the range, the template and the DC but picks up the
 * DC as an extra save ability.
 */
export default class WisteriaDragonPerfume extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Throw Orb",
      targetType: "creature",
      activationType: "action",
      data: {
        save: {
          ability: ["con"],
          dc: {
            calculation: "",
            formula: "19",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnStart"],
          }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Unconscious (Wisteria Perfume)",
        activityMatch: "Throw Orb",
        statuses: ["Unconscious"],
        daeSpecialDurations: ["isDamaged"],
        options: {
          durationSeconds: 60,
          description: "Unconscious for 1 minute. The effect ends early if the creature takes any damage. Floral dragons other than wisteria dragons have Disadvantage on the save.",
        },
      },
    ];
  }

}
