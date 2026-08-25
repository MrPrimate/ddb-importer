import DDBEnricherData from "../../data/DDBEnricherData";

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
        daeStackable: "none",
        data: {
          system: {
            changes: [
              DDBEnricherData.ChangeHelper.unsignedAddChange("+@abilities.cha.mod", 20, "system.rolls.damage.mwak.bonus"),
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
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("+@abilities.cha.mod", 20, "system.rolls.damage.mwak.bonus"),
        ],
      },
      {
        name: "Aura of Hate (Fiends and Undead)",
        auraeffectsOnly: true,
        daeStackable: "none",
        auraeffects: {
          applyToSelf: false,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: "@scale.oathbreaker.aura-of-hate",
          disposition: 0,
          evaluatePreApply: true,
          overrideName: "",
          script: `(Object.values(actor.system.details.type).concat(actor.system.details.race?.name).some(type => "undead; fiend".split(";").filter(t => t).includes(type?.toLowerCase())))`,
        },
        statuses: ["Aura of Hate (Fiends and Undead)"],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("+@abilities.cha.mod", 20, "system.rolls.damage.mwak.bonus"),
        ],
        options: {
          transfer: true,
        },
      },
    ];
  }

}
