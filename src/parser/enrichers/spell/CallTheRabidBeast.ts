import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Transforms the target into a rabid monster for the duration, granting the
 * bundle of benefits and restrictions from the description.
 */
export default class CallTheRabidBeast extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Rabid Beast",
        options: {
          durationSeconds: 60,
          description: "You have 20 temporary hit points and an AC of 17 if your AC is lower. You deal an additional +5 damage on Strength-based attacks and can make a Bite attack (1d6 + your Strength modifier slashing) as a Bonus Action. You are immune to the frightened condition, and you cannot maintain concentration or cast spells. At the start of each of your turns you must succeed on a DC 10 Wisdom saving throw or lose control.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("17", 20, "system.attributes.ac.min"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("5", 20, "system.bonuses.mwak.damage"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("frightened", 20, "system.traits.ci.value"),
        ],
      },
    ];
  }

}
