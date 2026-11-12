
const activationTypes: { id: number; value: TActivationCost }[] = [
  { id: 0, value: "none" },
  { id: 1, value: "action" },
  { id: 3, value: "bonus" },
  { id: 4, value: "reaction" },
  { id: 5, value: "action" },
  { id: 6, value: "minute" },
  { id: 7, value: "hour" },
  { id: 8, value: "special" },
  // DDB "No Action": nothing to spend. Listed after id 8 because the feature sort looks ids up by
  // value, and "special" must keep sorting last.
  { id: 2, value: "special" },
];


// dnd5e's action icons for activities named after a basic action, matched on the whole activity
// name. `since` marks icons the oldest supported dnd5e lacks: 5.x ships none, 6.0 only dash.svg.
const basicActionIcons: { name: string; path: string; since?: string }[] = [
  { name: "Dash", path: "systems/dnd5e/icons/svg/action/dash.svg", since: "6.0.0" },
  { name: "Disarm", path: "systems/dnd5e/icons/svg/action/disarm.svg", since: "6.1.0" },
  { name: "Disengage", path: "systems/dnd5e/icons/svg/action/disengage.svg", since: "6.1.0" },
  { name: "Dodge", path: "systems/dnd5e/icons/svg/action/dodge.svg", since: "6.1.0" },
  { name: "Help", path: "systems/dnd5e/icons/svg/action/help.svg", since: "6.1.0" },
  { name: "Hide", path: "systems/dnd5e/icons/svg/action/hide.svg", since: "6.1.0" },
  { name: "Influence", path: "systems/dnd5e/icons/svg/action/influence.svg", since: "6.1.0" },
  { name: "Pull", path: "systems/dnd5e/icons/svg/action/pull.svg", since: "6.1.0" },
  { name: "Push", path: "systems/dnd5e/icons/svg/action/push.svg", since: "6.1.0" },
  { name: "Reroll", path: "systems/dnd5e/icons/svg/action/reroll.svg", since: "6.1.0" },
  { name: "Search", path: "systems/dnd5e/icons/svg/action/search.svg", since: "6.1.0" },
  { name: "Study", path: "systems/dnd5e/icons/svg/action/study.svg", since: "6.1.0" },
  { name: "Trip", path: "systems/dnd5e/icons/svg/action/trip.svg", since: "6.1.0" },
  { name: "Utilize", path: "systems/dnd5e/icons/svg/action/utilize.svg", since: "6.1.0" },
];

export const ACTIONS = {
  activationTypes,
  basicActionIcons,
  attackTypes: [
    //  natural improv
    // { attackSubtype: 1, value: "" },
    { attackSubtype: 2, value: "natural" },
    { attackSubtype: 3, value: "simpleM" }, // unarmed
  ],
  damageType: [
    { name: "bludgeoning", id: 1 },
    { name: "piercing", id: 2 },
    { name: "slashing", id: 3 },
    { name: "necrotic", id: 4 },
    { name: "acid", id: 5 },
    { name: "cold", id: 6 },
    { name: "fire", id: 7 },
    { name: "lightning", id: 8 },
    { name: "thunder", id: 9 },
    { name: "poison", id: 10 },
    { name: "psychic", id: 11 },
    { name: "radiant", id: 12 },
    { name: "force", id: 13 },
    { name: null, id: null },
  ],
  aoeType: [
    { id: 1, value: "cone" },
    { id: 2, value: "cube" },
    { id: 3, value: "cylinder" },
    { id: 4, value: "line" },
    { id: 5, value: "sphere" },
    { id: 9, value: "square" },
    { id: 13, value: "square" },
    { id: 14, value: "radius" }, // emanation
    // presumably others here too! add when found
  ],
};
