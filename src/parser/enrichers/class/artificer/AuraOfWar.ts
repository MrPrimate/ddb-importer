import DDBEnricherData from "../../data/DDBEnricherData";
const DAMAGE_TYPES = [
  { type: "acid", label: "Acid", id: "ddbAuraOfWarAcid" },
  { type: "cold", label: "Cold", id: "ddbAuraOfWarCold" },
  { type: "fire", label: "Fire", id: "ddbAuraOfWarFire" },
  { type: "lightning", label: "Lightning", id: "ddbAuraOfWarLtng" },
  { type: "thunder", label: "Thunder", id: "ddbAuraOfWarThnd" },
] as const;

const activityName = (label: string): string => `Activate Aura of War: ${label}`;
const effectName = (label: string): string => `Aura of War: ${label}`;

function damageChanges(type: string): IActiveEffectChangeData[] {
  return [
    DDBEnricherData.ChangeHelper.unsignedAddChange(`1d4[${type}]`, 20, "system.rolls.damage.mwak.bonus"),
    DDBEnricherData.ChangeHelper.unsignedAddChange(`1d4[${type}]`, 20, "system.rolls.damage.rwak.bonus"),
  ];
}

export default class AuraOfWar extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    // the first damage type takes the parsed activity; the rest are duplicates of it
    const [first] = DAMAGE_TYPES;
    return {
      name: activityName(first.label),
      targetType: "ally",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: effectName(first.label),
            auraeffectsNever: true,
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ...DAMAGE_TYPES.slice(1).map(({ label, id }): IDDBAdditionalActivity => ({
        duplicate: true,
        id,
        overrides: {
          name: activityName(label),
          targetType: "ally",
          data: {
            behaviors: [
              DDBEnricherData.BehaviorHelper.applyEffect({
                effects: effectName(label),
                auraeffectsNever: true,
              }),
            ],
          },
        },
      })),
      {
        init: {
          name: "Aura of War (Damage Bonus)",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
        },
        overrides: {
          name: "Aura of War (Damage Bonus)",
          activationType: "none",
          noConsumeTargets: true,
          noTemplate: true,
          targetType: "creature",
          data: {
            range: {
              units: "spec",
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 1,
                  denomination: 4,
                  types: DAMAGE_TYPES.map(({ type }) => type),
                }),
              ],
            },
            behaviors: [],
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return DAMAGE_TYPES.flatMap(({ type, label }): IDDBEffectHint[] => [
      {
        name: effectName(label),
        standalone: true,
        auraeffectsNever: true,
        changes: damageChanges(type),
        options: {
          durationSeconds: 60,
        },
      },
      {
        name: effectName(label),
        activityMatch: activityName(label),
        auraeffectsOnly: true,
        daeStackable: "none",
        auraeffects: {
          applyToSelf: true,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: "30",
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
        },
        changes: damageChanges(type),
        options: {
          durationSeconds: 60,
        },
      },
    ]);
  }

}
