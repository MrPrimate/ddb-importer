// SPDX-License-Identifier: MIT
// Copyright © 2021 fvtt-lib-wrapper Rui Pinheiro


// A shim for the libWrapper library
export let libWrapper = undefined;

export const VERSIONS = [1, 13, 0];
export const TGT_SPLIT_RE = new RegExp("([^.[]+|\\[('([^'\\\\]|\\\\.)+?'|\"([^\"\\\\]|\\\\.)+?\")\\])", 'g');
export const TGT_CLEANUP_RE = new RegExp("(^\\['|'\\]$|^\\[\"|\"\\]$)", 'g');

// Main shim code
Hooks.once('init', () => {
  // Check if the real module is already loaded - if so, use it
  if (globalThis.libWrapper && !(globalThis.libWrapper.is_fallback ?? true)) {
    libWrapper = globalThis.libWrapper;
    return;
  }

  // Fallback implementation
  libWrapper = class {
    static get is_fallback() {
      return true;
    };

    static get WRAPPER() {
      return 'WRAPPER';
    };

    static get MIXED() {
      return 'MIXED';
    };

    static get OVERRIDE() {
      return 'OVERRIDE';
    };

    static get LISTENER() {
      return 'LISTENER';
    };

    static register(package_id, target, fn, type = "MIXED", { chain = undefined, bind = [] } = {}) {
      const is_setter = target.endsWith('#set');
      target = !is_setter ? target : target.slice(0, -4);
      const split = target.match(TGT_SPLIT_RE).map((x) => x.replace(/\\(.)/g, '$1').replace(TGT_CLEANUP_RE, ''));
      const root_nm = split.splice(0, 1)[0];

      let obj, fn_name;
      if (split.length == 0) {
        obj = globalThis;
        fn_name = root_nm;
      } else {
        const _eval = eval;
        fn_name = split.pop();
        obj = split.reduce((x, y) => x[y], globalThis[root_nm] ?? _eval(root_nm));
      }

      let iObj = obj;
      let descriptor = null;
      while (iObj) {
        descriptor = Object.getOwnPropertyDescriptor(iObj, fn_name);
        if (descriptor) break;
        iObj = Object.getPrototypeOf(iObj);
      }
      if (!descriptor || descriptor?.configurable === false) throw new Error(`libWrapper Shim: '${target}' does not exist, could not be found, or has a non-configurable descriptor.`);

      let original = null;
      const is_override = (type == 3 || type.toUpperCase?.() == 'OVERRIDE' || type == 3);
      const is_listener = (type == 4 || type.toUpperCase?.() == 'LISTENER' || type == 4);
      const wrapper = is_listener
        ? (
          function(...args) {
            fn.call(this, ...bind, ...args); return original.call(this, ...args);
          }
        )
        : ((chain ?? !is_override)
          ? function(...args) {
            return fn.call(this, original.bind(this), ...bind, ...args);
          }
          : function(...args) {
            return fn.call(this, ...bind, ...args);
          }
        );

      if (!is_setter) {
        if (descriptor.value) {
          original = descriptor.value;
          descriptor.value = wrapper;
        } else {
          original = descriptor.get;
          descriptor.get = wrapper;
        }
      } else {
        if (!descriptor.set) throw new Error(`libWrapper Shim: '${target}' does not have a setter`);
        original = descriptor.set;
        descriptor.set = wrapper;
      }

      descriptor.configurable = true;
      Object.defineProperty(obj, fn_name, descriptor);
    }
  };

  //* ************* USER CUSTOMIZABLE:
  // Set up the ready hook that shows the "libWrapper not installed" warning dialog. Remove if undesired.
  {
    //* ************* USER CUSTOMIZABLE:
    // Package ID & Package Title - by default attempts to auto-detect, but you might want to hardcode your package ID and title here to avoid potential auto-detect issues
    const [PACKAGE_ID, PACKAGE_TITLE] = (() => {
      const match = (import.meta?.url ?? Error().stack)?.match(/\/(worlds|systems|modules)\/(.+)(?=\/)/i);
      if (match?.length !== 3) return [null, null];
      const dirs = match[2].split('/');
      if (match[1] === 'worlds') return dirs.find((n) => n && game.world.id === n) ? [game.world.id, game.world.title] : [null, null];
      if (match[1] === 'systems') return dirs.find((n) => n && game.system.id === n) ? [game.system.id, game.system.title ?? game.system.data.title] : [null, null];
      const id = dirs.find((n) => n && game.modules.has(n));
      const mdl = game.modules.get(id);
      return [id, mdl?.title ?? mdl?.data?.title];
    })();

    if (!PACKAGE_ID || !PACKAGE_TITLE) {
      console.error("libWrapper Shim: Could not auto-detect package ID and/or title. The libWrapper fallback warning dialog will be disabled.");
      return;
    }

    Hooks.once('ready', () => {
      //* ************* USER CUSTOMIZABLE:
      // Title and message for the dialog shown when the real libWrapper is not installed.
      const FALLBACK_MESSAGE_TITLE = PACKAGE_TITLE;
      const FALLBACK_MESSAGE = `
				<p><b>'${PACKAGE_TITLE}' depends on the 'libWrapper' module, which is not present.</b></p>
				<p>A fallback implementation will be used, which increases the chance of compatibility issues with other modules.</p>
				<small><p>'libWrapper' is a library which provides package developers with a simple way to modify core Foundry VTT code, while reducing the likelihood of conflict with other packages.</p>
				<p>You can install it from the "Add-on Modules" tab in the <a href="javascript:game.shutDown()">Foundry VTT Setup</a>, from the <a href="https://foundryvtt.com/packages/lib-wrapper">Foundry VTT package repository</a>, or from <a href="https://github.com/ruipin/fvtt-lib-wrapper/">libWrapper's Github page</a>.</p></small>
			`;

      // Settings key used for the "Don't remind me again" setting
      const DONT_REMIND_AGAIN_KEY = "libwrapper-dont-remind-again";

      // Dialog code
      console.warn(`${PACKAGE_TITLE}: libWrapper not present, using fallback implementation.`);
      game.settings.register(PACKAGE_ID, DONT_REMIND_AGAIN_KEY, { name: '', default: false, type: Boolean, scope: 'world', config: false });
      if (game.user.isGM && !game.settings.get(PACKAGE_ID, DONT_REMIND_AGAIN_KEY)) {
        new Dialog({
          title: FALLBACK_MESSAGE_TITLE,
          content: FALLBACK_MESSAGE, buttons: {
            ok: { icon: '<i class="fas fa-check"></i>', label: 'Understood' },
            dont_remind: { icon: '<i class="fas fa-times"></i>', label: "Don't remind me again", callback: () => game.settings.set(PACKAGE_ID, DONT_REMIND_AGAIN_KEY, true) },
          },
        }).render(true);
      }
    });
  }
});
