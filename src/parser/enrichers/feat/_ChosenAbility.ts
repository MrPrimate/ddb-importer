import type DDBEnricherData from "../data/DDBEnricherData";

/**
 * The ability score a feat increased. A pick shows up in the parser's resolved choices, as the
 * feat's choice option ("Dexterity Score") and as a bonus modifier on the feat ("dexterity-score"); an unmade pick leaves an empty
 * choice and a placeholder modifier ("choose-strength-or-dexterity"). Null in the muncher, or when
 * no pick is recorded: the enricher then builds one activity per candidate ability, as the
 * official content does, and the user deletes the ones they do not use.
 */
export function chosenAbility<T extends { key: string; label: RegExp }>(enricher: DDBEnricherData, abilities: T[]): T | null {
  const parser = enricher.ddbParser;
  if (parser.isMuncher) return null;
  // the parser's resolved choices carry the pick for most feats ("Charisma")
  const fromParser = abilities.find((ability) => (parser._chosen ?? []).some((choice) => ability.label.test(choice.label ?? "")));
  if (fromParser) return fromParser;
  const character = parser.ddbData?.character;
  const choice = character?.choices?.feat?.find((c) => c.componentId === parser.ddbDefinition?.id && c.optionValue);
  const label = choice
    ? character.choices.choiceDefinitions
      .find((definition) => definition.id === `${choice.componentTypeId}-${choice.type}`)
      ?.options.find((option) => option.id === choice.optionValue)?.label ?? ""
    : "";
  const fromChoice = abilities.find((ability) => ability.label.test(label));
  if (fromChoice) return fromChoice;
  const scoreBonus = character?.modifiers?.feat?.find((mod) =>
    mod.componentId === parser.ddbDefinition?.id && mod.type === "bonus" && mod.subType.endsWith("-score"),
  );
  return scoreBonus ? abilities.find((ability) => ability.label.test(scoreBonus.subType)) ?? null : null;
}
