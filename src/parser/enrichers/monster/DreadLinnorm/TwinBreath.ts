import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Dread Linnorm Twin Breath (D&D Beyond Drops November 2026): a creature with any Exhaustion levels
 * automatically fails its save against it (the Bite gives the levels). An AC5e "grants" flag on the
 * linnorm fails such a save; the save roller is the rolling actor there. The parser's save, cone and
 * split Cold / Fire damage stay as built. Without AC5e this stays with the GM.
 */
export default class TwinBreath extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Twin Breath: Exhausted Targets Fail",
        options: {
          transfer: true,
          description: "A creature with any Exhaustion levels automatically fails its saving throw against Twin Breath.",
        },
        ac5eOnly: true,
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "rollingActor.statuses.exhaustion && item.name === 'Twin Breath'",
            20,
            "flags.automated-conditions-5e.grants.save.fail",
          ),
        ],
      },
    ];
  }

}
