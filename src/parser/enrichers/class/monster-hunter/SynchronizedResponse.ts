import DDBEnricherData from "../../data/DDBEnricherData";

/** Devourer Guild: for a minute after consuming a monster portion, attacks made as part of a Reaction deal 1d6 extra damage. */
export default class SynchronizedResponse extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Reaction Attack Damage",
      targetType: "creature",
      activationType: "special",
      activationCondition: "Within a minute of consuming a monster portion, you hit with an attack made as part of a Reaction",
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6 })],
        },
      },
    };
  }

}
