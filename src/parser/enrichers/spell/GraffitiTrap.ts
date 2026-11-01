import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Graffiti Trap (OTFY): on a failed Dexterity save the target is Restrained (parsed); on a success
 * its Speed is halved until the start of its next turn. Both effects are linked, the second with
 * onSave so it can be applied to a creature that succeeds.
 */
export default class GraffitiTrap extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Graffiti Trap: Restrained",
        statuses: ["restrained"],
        options: {
          durationSeconds: 60,
        },
      },
      {
        name: "Graffiti Trap: Speed Halved",
        onSave: true,
        options: {
          expiry: "targetStart",
        },
        changes: [
          DDBEnricherData.ChangeHelper.customChange("/2", 20, "system.attributes.movement.all"),
        ],
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

}
