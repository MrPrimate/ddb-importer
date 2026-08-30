import DDBEnricherData from "../data/DDBEnricherData";

export default class AcidArrow extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 4,
              denomination: 4,
              type: "acid",
            }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "End of Targets Turn Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, type: "acid" })],
          noeffect: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        activityMatch: "Cast",
        name: "Covered in Acid",
        options: {
          expiry: "targetEnd",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            `label=Acid Arrow (End of Turn),turn=end,damageRoll=(@spellLevel)d4[acid],damageType=acid,killAnim=true`,
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
