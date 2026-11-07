import DragonbornDraconicFlight from "../dragonborn/DraconicFlight";

/**
 * Dracthyr (World of Warcraft): from character level 5, a 1/LR Bonus Action gives a Fly Speed equal
 * to the Speed for 10 minutes, as the dragonborn trait of the same name does.
 */
export default class DraconicFlight extends DragonbornDraconicFlight {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Draconic Flight",
        options: {
          durationSeconds: 600,
          description: "Your natural form's wings give you a Fly Speed equal to your Speed for 10 minutes.",
        },
        changes: [
          DragonbornDraconicFlight.ChangeHelper.upgradeChange("@attributes.movement.speeds.walk", 20, "system.attributes.movement.speeds.fly"),
        ],
      },
    ];
  }

}
