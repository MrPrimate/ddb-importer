import DDBEnricherData from "../data/DDBEnricherData";

export default class EvilEye extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        // the wording gives no expiry; a cantrip should not hold this open
        // indefinitely, so it lapses at the start of the caster's next turn
        name: "Evil Eye: Increased Critical Range",
        ac5eOnly: true,
        options: {
          durationSeconds: 6,
          durationRounds: 1,
        },
        daeSpecialDurations: ["turnStartSource"],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.addChange("set=19", 20, "flags.automated-conditions-5e.grants.attack.criticalThreshold"),
        ],
      },
    ];
  }

}
