import DDBEnricherData from "../../data/DDBEnricherData";

const AURA = { bestFormula: "max(1, @abilities.cha.mod)", overrideName: "Aura of Hate" };

export default class AuraOfHate extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Place Aura",
      targetType: "creature",
      activationType: "special",
      data: {
        target: {
          template: {
            contiguous: false,
            type: "radius",
            size: "@scale.oathbreaker.aura-of-hate",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: "Aura of Hate (Fiends and Undead)",
            types: ["fiend", "undead"],
            auraeffectsNever: true,
          }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Aura of Hate (Self)",
        auraeffectsNever: true,
        daeStackable: "none",
        data: {
          system: {
            changes: [
              DDBEnricherData.ChangeHelper.unsignedAddChange(`+${AURA.bestFormula}`, 20, "system.rolls.damage.mwak.bonus"),
            ],
          },
        },
        statuses: ["Aura of Hate (Self)"],
        options: {
          transfer: true,
        },
      },
      {
        name: "Aura of Hate (Fiends and Undead)",
        standalone: true,
        originReplacement: true,
        auraeffectsNever: true,
        data: { flags: { ddbimporter: { aura: { ...AURA } } } },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(`+${AURA.bestFormula}`, 20, "system.rolls.damage.mwak.bonus"),
        ],
      },
      {
        name: "Aura of Hate (Fiends and Undead)",
        auraeffectsOnly: true,
        daeStackable: "none",
        auraeffects: {
          ...AURA,
          applyToSelf: true,
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: "@scale.oathbreaker.aura-of-hate",
          disposition: 0,
          evaluatePreApply: true,
          script: `actor.uuid === sourceToken.actor.uuid || ["fiend", "undead"].includes(actor.system.details.type?.value?.toLowerCase())`,
        },
        statuses: ["Aura of Hate (Fiends and Undead)"],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(`+${AURA.bestFormula}`, 20, "system.rolls.damage.mwak.bonus"),
        ],
        options: {
          transfer: true,
        },
      },
    ];
  }

}
