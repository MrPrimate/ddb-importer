import DDBEnricherData from "../../data/DDBEnricherData";

export default class GroupRecovery extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity() {
    return {
      addItemConsume: true,
      targetType: "ally",
      activationType: "special",
      activationCondition: "You use Second Wind",
      targetCount: "max(1, @abilities.cha.mod)",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 4,
          bonus: "@classes.fighter.levels",
          types: ["healing"],
        }),
        target: {
          affects: {
            type: "ally",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "@scale.banneret.group-recovery",
            units: "ft",
          },
        },
      },
    };
  }

  get override() {
    const uses = this._getGeneratedUses({
      name: "Second Wind: Group Recovery",
      type: "class",
    });
    return {
      uses,
    };
  }
}
