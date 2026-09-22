import DDBEnricherData from "../../data/DDBEnricherData";

const AURA = { bestFormula: "max(1, @abilities.cha.mod)", overrideName: "Aura of Hate" };

export default class AuraOfHate extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Aura of Hate (Self)",
        // with Aura Effects the aura below applies to the paladin as well
        auraeffectsNever: true,
        daeStackable: "none",
        data: {
          changes: [
            DDBEnricherData.ChangeHelper.unsignedAddChange(`+${AURA.bestFormula}`, 20, "system.bonuses.mwak.damage"),
          ],
        },
        statuses: ["Aura of Hate (Self)"],
        options: {
          transfer: true,
        },
      },
      {
        name: "Aura of Hate (Fiends and Undead)",
        aurasOnly: true,
        daeStackable: "none",
        data: {
          flags: {
            ActiveAuras: {
              aura: "All",
              radius: "@scale.oathbreaker.aura-of-hate",
              isAura: true,
              ignoreSelf: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
              type: "undead; fiend",
            },
          },
        },
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
          DDBEnricherData.ChangeHelper.unsignedAddChange(`+${AURA.bestFormula}`, 20, "system.bonuses.mwak.damage"),
        ],
        options: {
          transfer: true,
        },
      },
    ];
  }

}
