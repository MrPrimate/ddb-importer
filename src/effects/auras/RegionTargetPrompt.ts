import logger from "../../lib/Logger";
import RegionBehaviorSettings from "../../lib/RegionBehaviorSettings";
import type { DDBSocket } from "../../hooks/socket/sockets";
import RegionTargetPreview from "./RegionTargetPreview";

interface IRemotePrompt {
  sender: string;
  controller: AbortController;
}

/** Owner selection stays on the player's client; only the GM uses the chosen activity. */
export default class RegionTargetPrompt {
  static #remote = new Map<string, IRemotePrompt>();

  static owner(actor: Actor.Implementation): User.Implementation | null {
    const owners = [...game.users].filter(
      (user) => user.active && !user.isGM && actor.testUserPermission(user, "OWNER"),
    );
    owners.sort((a, b) => a.id.localeCompare(b.id));
    return (
      owners.find((user) => user.character?.uuid === actor.uuid || (!!actor.id && user.character?.id === actor.id)) ??
      owners[0] ??
      null
    );
  }

  /** Reject unsolicited recipients and activity ids rather than trusting a socket response. */
  static validate(value: unknown, request: IRegionTargetRequest): IRegionTargetChoice | null {
    if (!value || typeof value !== "object") return null;
    const choice = value as Partial<IRegionTargetChoice>;
    if (
      !Array.isArray(choice.tokens) ||
      !choice.tokens.every((uuid) => typeof uuid === "string" && request.tokenUuids.includes(uuid))
    )
      return null;
    const tokens = [...new Set(choice.tokens)];
    const activity = request.activities.find((candidate) => candidate.id === choice.activity);
    if (!activity || !tokens.length || tokens.length > (activity.max ?? request.max)) return null;
    return { tokens, activity: choice.activity! };
  }

  /** Hidden or unrendered tokens are never revealed by a player-facing selection list. */
  static visibleTokens(request: IRegionTargetRequest): TokenDocument.Implementation[] {
    return request.tokenUuids.flatMap((uuid) => {
      const token = fromUuidSync(uuid) as TokenDocument.Implementation | null;
      if (!token?.actor || !token.uuid) return [];
      if (!game.user.isGM && (token.hidden || !token.object?.isVisible)) return [];
      return [token];
    });
  }

  /** Video token art uses a still actor portrait; no thumbnail work delays a pending choice. */
  static tokenImage(token: TokenDocument.Implementation): string {
    return [token.texture.src, token.actor?.img].find(
      (src) => src && !foundry.helpers.media.VideoHelper.hasVideoExtension(src),
    ) ?? "icons/svg/mystery-man.svg";
  }

  static async show(request: IRegionTargetRequest, signal: AbortSignal, waiting = false): Promise<unknown> {
    if (signal.aborted) return null;
    const escape = foundry.utils.escapeHTML;
    const tokens = waiting ? [] : RegionTargetPrompt.visibleTokens(request);
    const content = waiting
      ? `<p>${escape(game.i18n.localize("ddb-importer.behaviors.macro.choice.waiting"))}</p>`
      : `<p>${escape(request.instruction)}</p><p>${escape(game.i18n.format("ddb-importer.behaviors.macro.choice.limit", { max: request.max }))}</p>` +
        `<div class="ddb-region-recipients">` + tokens
        .map(
          (token) =>
            `<label class="ddb-region-recipient"><input type="checkbox" name="recipient" value="${escape(token.uuid ?? "")}">` +
              `<img src="${escape(RegionTargetPrompt.tokenImage(token))}" alt="" width="36" height="36" loading="lazy">` +
              `<span>${escape(token.name ?? "")}</span></label>`,
        )
        .join("") + `</div>` +
        `<select name="activity">${request.activities.map((a) => `<option value="${escape(a.id)}">${escape(a.name)}</option>`).join("")}</select>`;
    let dialog: { close: () => Promise<unknown> } | undefined;
    let preview: RegionTargetPreview | undefined;
    let listeners: AbortController | undefined;
    const cleanup = () => {
      preview?.destroy();
      listeners?.abort();
    };
    const abort = () => {
      cleanup();
      void dialog?.close();
    };
    signal.addEventListener("abort", abort, { once: true });
    try {
      return await foundry.applications.api.DialogV2.wait({
        modal: false,
        window: { title: request.title },
        content,
        rejectClose: false,
        buttons: [
          ...(waiting
            ? [{ action: "takeover", label: "ddb-importer.behaviors.macro.choice.takeover" }]
            : [
              {
                action: "choose",
                label: "ddb-importer.behaviors.macro.choice.choose",
                callback: (_event: Event, button: HTMLButtonElement) => {
                  const form = button.form;
                  if (!form) return null;
                  const data = new FormData(form);
                  return RegionTargetPrompt.validate(
                    { tokens: data.getAll("recipient"), activity: data.get("activity") },
                    request,
                  );
                },
              },
            ]),
          { action: "skip", label: "ddb-importer.behaviors.macro.choice.skip" },
        ],
        render: (_event: Event, app: { close: () => Promise<unknown>; element?: HTMLElement }) => {
          cleanup();
          dialog = app;
          if (signal.aborted) {
            abort();
            return;
          }
          const form = app.element?.querySelector("form");
          listeners = new AbortController();
          for (const img of form?.querySelectorAll<HTMLImageElement>(".ddb-region-recipient img") ?? []) {
            img.addEventListener("error", () => {
              img.src = "icons/svg/mystery-man.svg";
            }, { once: true, signal: listeners.signal });
          }
          if (form && tokens.length) preview = new RegionTargetPreview(form, tokens);
          const constrain = () => {
            if (!form) return;
            const activity = request.activities.find(
              (candidate) => candidate.id === new FormData(form).get("activity"),
            );
            const limit = activity?.max ?? request.max;
            const checkboxes = [...form.querySelectorAll<HTMLInputElement>("input[name=\"recipient\"]")];
            const count = checkboxes.filter((checkbox) => checkbox.checked).length;
            for (const checkbox of checkboxes) checkbox.disabled = !checkbox.checked && count >= limit;
            const submit = form.querySelector<HTMLButtonElement>("button[data-action=\"choose\"]");
            if (submit) submit.disabled = count > limit;
          };
          form?.addEventListener("change", constrain, { signal: listeners.signal });
          constrain();
        },
        close: () => {
          cleanup();
          return null;
        },
      });
    } finally {
      cleanup();
      signal.removeEventListener("abort", abort);
    }
  }

  static registerSocket(socket: DDBSocket): void {
    if (!RegionBehaviorSettings.enabled) return;
    Hooks.on<"userConnected">("userConnected", () => RegionTargetPrompt.cancelObsolete());
    Hooks.on<"updateUser">("updateUser", () => RegionTargetPrompt.cancelObsolete());
    Hooks.on<"deleteUser">("deleteUser", () => RegionTargetPrompt.cancelObsolete());
    socket.register(
      "regionTargetPrompt",
      async function (this: { socketData: { userId: string } }, request: IRegionTargetRequest) {
        const sender = this.socketData.userId;
        if (!RegionBehaviorSettings.enabled || !game.users.get(sender)?.isActiveGM) return null;
        const actor = fromUuidSync(request.actorUuid) as Actor.Implementation | null;
        if (!actor?.testUserPermission(game.user, "OWNER") || !fromUuidSync(request.regionUuid)) return null;
        const controller = new AbortController();
        RegionTargetPrompt.#remote.set(request.id, { sender, controller });
        try {
          return await RegionTargetPrompt.show(request, controller.signal);
        } finally {
          RegionTargetPrompt.#remote.delete(request.id);
        }
      },
    );
    socket.register("cancelRegionTargetPrompt", function (this: { socketData: { userId: string } }, id: string) {
      const prompt = RegionTargetPrompt.#remote.get(id);
      if (prompt?.sender === this.socketData.userId) prompt.controller.abort();
    });
  }

  /** The requesting GM may disappear before it can send its cancellation notification. */
  static cancelObsolete(): void {
    for (const { sender, controller } of RegionTargetPrompt.#remote.values()) {
      if (!game.users.get(sender)?.isActiveGM) controller.abort();
    }
  }

  /** No timeout: the GM explicitly takes over or skips an unanswered player request. */
  static async choose(
    request: IRegionTargetRequest,
    actor: Actor.Implementation,
    signal: AbortSignal,
  ): Promise<IRegionTargetChoice | null> {
    if (!RegionBehaviorSettings.enabled) return null;
    const owner = RegionTargetPrompt.owner(actor);
    const ownerId = owner?.id;
    if (!ownerId) return RegionTargetPrompt.validate(await RegionTargetPrompt.show(request, signal), request);
    const socket = DDBImporter.socket;
    const remote = new AbortController();
    const waiting = new AbortController();
    const abort = () => {
      remote.abort();
      waiting.abort();
      socket.notifyUser("cancelRegionTargetPrompt", ownerId, request.id);
    };
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    try {
      const player = socket
        .executeAsUserWithSignal("regionTargetPrompt", ownerId, remote.signal, request)
        .then((value: unknown) => ({ source: "player", value }))
        .catch((error: unknown) => {
          if (!remote.signal.aborted) logger.warn("Owner-turn recipient prompt could not reach its owner", error);
          // The GM's controls remain available after disconnection; never choose for them.
          return new Promise<never>(() => {
            /* Only the GM's pending controls may settle this request now. */
          });
        });
      const gm = RegionTargetPrompt.show(request, waiting.signal, true).then((value) => ({ source: "gm", value }));
      const result = await Promise.race([player, gm]);
      abort();
      if (signal.aborted) return null;
      if (result.source === "gm" && result.value === "takeover") {
        return RegionTargetPrompt.validate(await RegionTargetPrompt.show(request, signal), request);
      }
      return RegionTargetPrompt.validate(result.value, request);
    } finally {
      abort();
      signal.removeEventListener("abort", abort);
    }
  }
}
