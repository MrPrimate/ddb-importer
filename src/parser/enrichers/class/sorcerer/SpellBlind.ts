import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpellBlind extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Spell Blind",
      targetType: "enemy",
      activationType: "action",
      activationCondition: "Hostile creatures starting their turn within 60 ft; lasts 1 minute (concentration)",
      addItemConsume: true,
      itemConsumeTargetName: "Sorcery Points",
      itemConsumeValue: "5",
      data: {
        save: {
          ability: ["con"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
        range: {
          units: "self",
        },
        target: {
          template: {
            type: "radius",
            size: "60",
            units: "ft",
            count: "",
            contiguous: false,
            width: "",
            height: "",
          },
        },
        duration: {
          value: "1",
          units: "minute",
        },
      },
    };
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Blinded",
        activityMatch: "Spell Blind",
        statuses: ["Blinded"],
        options: {
          durationSeconds: 60,
          description: "Blinded until the empowered Flickering Aura ends.",
        },
      },
    ];
  }

}
