import DDBEnricherData from "../../data/DDBEnricherData";

export default class CompoundCreatorDraught extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  draughtEffect(name: string, ability: string): IDDBEffectHint {
    return {
      name,
      activityMatch: "Consume Compound",
      options: {
        durationSeconds: 600,
      },
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, `system.abilities.${ability}.check.roll.mode`),
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, `system.abilities.${ability}.save.roll.mode`),
      ],
    };
  }

}
