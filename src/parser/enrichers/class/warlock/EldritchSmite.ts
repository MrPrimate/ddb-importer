import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Both printings: once per turn on a pact weapon hit, expend a Pact Magic slot for force damage of
 * 1d8 plus 1d8 per slot level, and optionally knock a Huge or smaller target Prone. One damage
 * activity spends the slot, with the Prone effect to apply from the card (the official SRD shape).
 */
export default class EldritchSmite extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Smite",
      targetType: "creature",
      activationType: "special",
      activationCondition: "Once per turn when you hit a creature with your pact weapon",
      noConsumeTargets: true,
      additionalConsumptionTargets: [
        {
          type: "attribute",
          value: "1",
          target: "spells.pact.value",
        },
      ],
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "(1 + @spells.pact.level)d8",
              types: ["force"],
            }),
          ],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Eldritch Smite: Prone",
        statuses: ["Prone"],
        activityMatch: "Smite",
        options: {
          description: "Only a Huge or smaller creature can be knocked Prone.",
        },
      },
      {
        name: "Eldritch Smite (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional once per turn extra damage on a pact weapon hit, expending a Pact Magic spell slot. Apply the Prone rider to Huge or smaller targets manually.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=(1 + @spells.pact.level)d8[force]; usesCount=spells.pact; oncePerTurn; optin; actionType.mwak || actionType.rwak",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
