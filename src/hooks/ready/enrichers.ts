
import { logger, DDBSimpleMacro } from "../../lib/_module";

/**
 * Parse a roll string into a configuration object.
 * @param {string} match  Matched configuration string.
 * @returns {object}
 */
function parseConfig(match: string) {
  const config: Record<string, any> = { _config: match, values: [] as string[] };
  for (const part of match.match(/(?:[^\s"]+|"[^"]*")+/g) ?? []) {
    if (!part) continue;
    const [key, value] = part.split("=");
    const valueLower = value?.toLowerCase();
    if (value === undefined) config.values.push(key.replace(/(^"|"$)/g, ""));
    else if (["true", "false"].includes(valueLower)) config[key] = valueLower === "true";
    else if (Number.isNumeric(value)) config[key] = Number(value);
    else config[key] = value.replace(/(^"|"$)/g, "");
  }
  return config;
}

/**
 * Add a dataset object to the provided element.
 * @param {HTMLElement} element  Element to modify.
 * @param {object} dataset       Data properties to add.
 * @private
 */
function _addDataset(element: HTMLElement, dataset: Record<string, any>) {
  for (const [key, value] of Object.entries(dataset)) {
    if (!key.startsWith("_") && (key !== "values") && value) element.dataset[key] = value;
  }
}

/* -------------------------------------------- */

/**
 * Create a rollable link.
 * @param {string} label    Label to display.
 * @param {object} dataset  Data that will be added to the link for the rolling method.
 * @returns {HTMLElement}
 */
function createFunctionLink(label: string, dataset: Record<string, any>) {
  const span = document.createElement("span");
  span.classList.add("roll-link");
  _addDataset(span, dataset);

  // Add main link
  const link = document.createElement("a");
  link.dataset.action = "roll";
  link.innerHTML = `<i class="fa-solid fa-wand"></i>${label}`;
  span.insertAdjacentElement("afterbegin", link);

  return span;
}


async function enrichFunction(config: Record<string, any>, label: string, options: TextEditor.EnrichmentOptions) {
  // console.warn("ENRICHER DEGUG", {
  //   config,
  //   label,
  //   options,
  // });

  // null tells the enricher pipeline to leave the text as is
  if (!config.functionName || !config.functionType) return null;

  const dataset: {
    type: string;
    functionName: any;
    functionType: any;
    functionParams: any;
    rollItemUuid?: string;
    rollItemActor?: string;
    rollItemName?: string;
  } = {
    type: "ddbfunction",
    functionName: config.functionName,
    functionType: config.functionType,
    functionParams: config.functionParams ?? null,
  };

  let foundItem;

  const foundActor = options.relativeTo instanceof Item
    ? options.relativeTo.parent
    : options.relativeTo instanceof Actor ? options.relativeTo : null;

  // If config is an Item ID
  if (config.itemName && (/^\w{16}$/).test(config.itemName) && foundActor) foundItem = foundActor.items.get(config.itemName);

  // If config is a relative UUID
  if (config.itemName?.startsWith(".")) {
    try {
      foundItem = await fromUuid(config.itemName, { relative: options.relativeTo });
    } catch {
      return null;
    }
  }

  if (foundItem) {
    if (!label) label = foundry.utils.getProperty(foundItem, "name") as string;
    dataset.rollItemUuid = foundItem.uuid;
    return createFunctionLink(label, dataset);
  }

  // if itemName is provided, use that as the relative item
  dataset.rollItemActor = foundActor?.uuid ?? undefined;
  if (!label) label = `DDB Macro`;
  if (config.itemName) {
    dataset.rollItemName = config.itemName;
    return createFunctionLink(label, dataset);
  }

  // Finally, use relative item
  // relativeTo can be absent at the type level; when it is, this line has always
  // thrown a TypeError, so the assertion preserves the existing runtime behaviour
  dataset.rollItemUuid = options.relativeTo!.uuid ?? undefined;
  return createFunctionLink(label, dataset);
}

/**
 * Run the macro from the enricher
 * @param {RegExpMatchArray} match       The regular expression match result.
 * @param {EnrichmentOptions} options    Options provided to customize text enrichment.
 * @returns {Promise<HTMLElement|null>}  An HTML element to insert in place of the matched text or null to
 *                                       indicate that no replacement should be made.
 */
async function macroEnricher(match: RegExpMatchArray, options: TextEditor.EnrichmentOptions = {}) {
  const { type, label } = match.groups as Record<string, string>;
  const config = parseConfig((match.groups as Record<string, string>).config);
  config._input = match[0];
  switch (type.toLowerCase()) {
    case "dbbfunc":
    case "dbbifunc":
    case "ddbfunc":
    case "ddbifunc":
      return enrichFunction(config, label, options);
    // no default
  }
  return null;
}

/**
 * Perform the provided function call.
 * @param {Event} event  The click event triggering the action.
 * @returns {Promise}
 */
async function runFunction(event: any) {
  const target = event.target.closest(".roll-link, [data-action=\"rollRequest\"], [data-action=\"concentration\"]");
  if (!target) return;
  event.stopPropagation();

  const { functionName, functionParams, functionType, rollItemActor, rollItemUuid, type, rollItemName } = target.dataset;

  if (type !== "ddbfunction") return;

  const action = event.target.closest("a")?.dataset.action ?? "roll";

  if (action !== "roll") return;

  target.disabled = true;

  const actor = rollItemActor ? await fromUuid(rollItemActor) as Actor.Implementation : null;

  try {
    // DDBSimpleMacro.execute treats absent ids by truthiness, so undefined is equivalent to null here
    const ids = {
      effect: undefined as string | undefined,
      actor: rollItemActor,
      token: actor?.isOwner ? canvas.tokens.controlled[0]?.document?.uuid : undefined,
      item: rollItemUuid,
      origin: rollItemUuid,
    };
    const context = {};
    const scope = {
      rollItemName,
      functionParams,
      rollItemActor,
      rollItemUuid,
    };

    logger.debug(`Calling DDBSimpleMacro execution`, {
      functionType,
      functionName,
      context,
      ids,
      functionParams,
      scope,
    });


    await DDBSimpleMacro.execute(functionType, functionName, context, ids, scope);
  } finally {
    target.disabled = false;
  }
}

export function registerCustomEnrichers() {
  CONFIG.TextEditor.enrichers.push(
    {
      pattern:
        /\[\[\/(?<type>ddbifunc) (?<config>[^\]]+)]](?:{(?<label>[^}]+)})?/gi,
      enricher: macroEnricher,
    },
  );

  document.body.addEventListener("click", runFunction);
}
