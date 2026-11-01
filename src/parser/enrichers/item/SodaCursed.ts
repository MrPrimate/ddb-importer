import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Soda (Cursed) (OTFY): drinking it curses you until a level 5+ Remove Curse (or the Black Cinnamon
 * bath). The daily expended slot, or 2d10 Necrotic without one, happens at a GM-chosen time, so the
 * curse is a marker effect carrying that text rather than a damage roll on drinking.
 */
export default class SodaCursed extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Drink",
      activationType: "bonus",
      overrideActivation: true,
      addItemConsume: true,
      targetType: "self",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Cursed Soda",
        activityMatch: "Drink",
        options: {
          transfer: false,
          description: "Each day at a random time one of your spell slots, or one spell you can cast from an attuned magic item, is expended (GM's choice). With none available you take 2d10 Necrotic damage instead. Ends with a level 5+ Remove Curse or similar magic, or by eating a pound of Black Cinnamon and bathing in a still pool.",
        },
      },
    ];
  }

}
