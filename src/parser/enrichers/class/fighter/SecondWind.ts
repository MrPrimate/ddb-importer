import DDBEnricherData from "../../data/DDBEnricherData";

export default class SecondWind extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      addItemConsume: true,
      targetType: "self",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 10,
          bonus: "@classes.fighter.levels",
          types: ["healing"],
        }),
      },
    };
  }

  get override() {
    if (!this.is2024) return null;
    const uses = foundry.utils.deepClone(this.data.system.uses);
    const recovery = foundry.utils.deepClone(uses.recovery ?? []);
    if (recovery.length === 0) recovery.push({ period: "lr", type: 'recoverAll' });
    recovery.push({ period: "sr", type: 'formula', formula: "1" });
    uses.recovery = recovery;
    return {
      uses,
    };
  }
}
