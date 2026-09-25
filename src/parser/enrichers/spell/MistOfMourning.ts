import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The mist rolls its save as it appears, then again for a creature that moves in or ends its turn
 * there: the second is a free copy of the cast with no slot and no template, rolled by hand. DDB
 * records the 1d8 the melancholy takes off damage rolls as damage the spell deals, so that part is
 * removed and lives on the effect.
 */
export default class MistOfMourning extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      id: "ddbMistMournSpSv",
      removeDamageParts: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbMistMournZon1",
        overrides: {
          name: "Ongoing Save",
          activationType: "special",
          activationCondition: "Moves into the mist for the first time on a turn or ends its turn there",
          removeSpellSlotConsume: true,
          noConsumeTargets: true,
          noTemplate: true,
          data: {
            duration: {
              units: "inst",
              concentration: false,
              override: true,
            },
            range: { override: true, units: "spec" },
            target: { override: true },
          },
        },
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        // unmatched, so both the cast and its ongoing copy carry it
        name: "Deep Melancholy",
        changes: [
          DDBEnricherData.ChangeHelper.customChange("/2", 20, "system.attributes.movement.all"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d8", 20, "system.bonuses.mwak.damage"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d8", 20, "system.bonuses.rwak.damage"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d8", 20, "system.bonuses.msak.damage"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d8", 20, "system.bonuses.rsak.damage"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        ],
        options: {
          transfer: false,
          expiry: "targetEnd",
          durationRounds: 1,
          durationSeconds: 6,
          description: "Speed halved, Disadvantage on attack rolls, and 1d8 subtracted from all damage rolls until the end of its next turn.",
        },
      },
    ];
  }

}
