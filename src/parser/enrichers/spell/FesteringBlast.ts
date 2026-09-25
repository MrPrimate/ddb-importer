import DDBEnricherData from "../data/DDBEnricherData";

export default class FesteringBlast extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        damage: {
          onSave: "none",
          parts: [
            DDBEnricherData.basicDamagePart({ number: 4, denomination: 10, type: "necrotic", scalingMode: "whole", scalingNumber: 1 }),
          ],
        },
        target: {
          affects: { type: "creature" },
          template: { type: "line", size: "60", width: "10", units: "ft" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Poison Damage (Start of Turn)",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          noSpellslot: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 10, type: "poison", scalingMode: "none" }),
          ],
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          activationCondition: "Start of a Poisoned target's turn",
          noTemplate: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Festering",
        statuses: ["Poisoned"],
        options: { durationSeconds: 60 },
        midiChanges: [
          DDBEnricherData.ChangeHelper.overTimeDamageChange({
            document: this.data,
            turn: "start",
            damage: "2d10",
            damageType: "poison",
            saveAbility: "con",
            saveRemove: true,
            saveDamage: "nodamage",
            dc: "@attributes.spell.dc",
          }),
        ],
      },
    ];
  }

}
