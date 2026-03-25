import Generic from "../Generic";

export default class RadiantSunBolt extends Generic {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Radiant Sun Bolt (Bonus Action)",
          activationType: "bonus",
          itemConsumeValue: 1,
          itemConsumeTargetName: this.is2014 ? "Ki" : "Monk's Focus",
          addItemConsume: true,
        },
      },
    ];
  }

}
