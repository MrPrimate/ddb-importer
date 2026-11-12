import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Six Feet Under: the first hit on each of your turns against a Prone target deals maximum damage.
 * AC5e maximises it once per turn; the macro activity works it out for tables without AC5e.
 */
export default class CryptKeeperGlaive extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      DDBEnricherData.maximumDamageActivity({
        condition: "The first time on each of your turns that you hit a Prone target with this weapon",
        parameters: { title: "Six Feet Under", thisItem: true },
      }),
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      DDBEnricherData.maximumDamageEffect({
        name: "Six Feet Under",
        description: "The first hit on each of your turns against a Prone target deals maximum damage.",
        condition: `isTurn && ${this.ac5eSelfItemCondition} && opponentActor.statuses.prone`,
        oncePerTurn: true,
      }),
    ];
  }

}
