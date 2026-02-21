import Generic from "../Generic";

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
