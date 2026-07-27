/* eslint-disable no-console */

// { speaker, actor, token, character, item, rolledItem, macroItem, args, scope, workflow }

export default async function test(this: Record<string, unknown>, {
  speaker, actor, token, character, item, rolledItem, macroItem,
  args, scope, workflow,
}: IMidiMacroFunctionContext = {}) {

  console.warn("TEST", {
    speaker,
    actor,
    token,
    character,
    item,
    rolledItem,
    macroItem,
    args,
    scope,
    workflow,
  });

  let variables = "";

  for (const name in this) variables += name + "\n";

  console.warn("VARIABLES", variables);
}
