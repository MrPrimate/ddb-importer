/* eslint-disable class-methods-use-this */
import Generic from "../Generic.mjs";

export default class RadiantSunBolt extends Generic {

  get additionalActivities() {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Radiant Sun Bolt (Bonus Action)",
          activationType: "bonus",
          itemConsumeValue: 1,
          itemConsumeTargetName: "Ki",
          addItemConsume: true,
        },
      },
    ];
  }

}
