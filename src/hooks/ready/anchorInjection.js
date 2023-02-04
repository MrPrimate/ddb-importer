import logger from "../../logger.js";
import utils from "../../lib/utils.js";

function addSlugField(element, slug) {
  const titleInput = element.querySelector("input[name='text']");
  const slugHTML = `<div class="form-group">
  <label>Jump to HTML Slug</label>
  <div class="form-fields">
      <input type="text" name="slug" value="${slug}" placeholder="">
  </div>
</div>`;

  const div = utils.htmlToElement(slugHTML);
  titleInput.parentNode.parentNode.parentNode.insertBefore(div, titleInput.parentNode.parentNode.nextSibling.nextSibling);
}

function updateSlugField(element, slug) {
  const slugInput = element.querySelector("input[name='slug']");
  slugInput.setAttribute('value', slug);
}

async function saveSlug(note, slug) {
  await note.scene.updateEmbeddedDocuments("Note", [
    {
      _id: note.id,
      flags: {
        "anchor.slug": slug,
        "ddb.slugLink": slug,
        "ddb.labelName": note.label,
      },
    },
  ]);
}

export function anchorInjection() {
  Hooks.on("activateNote", (note, options) => {
    if (note.document?.flags?.ddb?.slugLink) {
      logger.debug("Injecting note anchor", note.document.flags.ddb.slugLink);
      options["anchor"] = note.document.flags.ddb.slugLink;
    } else if (note.document.flags.anchor?.slug) {
      logger.debug("Injecting note anchor", note.document.flags.anchor.slug);
      options["anchor"] = note.document.flags.anchor.slug;
    } else if (note.document?.flags?.anchor) {
      logger.debug("Injecting note anchor", note.document.flags.anchor);
      options["anchor"] = note.document.flags.anchor;
    }
  });

  // when we render a note we add the
  Hooks.on("renderNoteConfig", (noteConfig) => {
    const slug = noteConfig.document.flags.ddb?.slugLink
      ?? noteConfig.document.flags.anchor?.slug
      ?? "";
    addSlugField(noteConfig.element[0], slug);
    noteConfig.element[0].style.height = "auto";

    // capture notes that are now refreshed after this point
    const closeRefreshId = Hooks.on("refreshNote", async (note) => {
      if (noteConfig.object.id !== note.document.id) return;
      // capture note config close hooks and trigger a check on that
      const closeNoteId = Hooks.on("closeNoteConfig", async (closeNoteConfig) => {
        if (noteConfig.id == closeNoteConfig.id) {
          Hooks.off("closeNoteConfig", closeNoteId);
          Hooks.off("refreshNote", closeRefreshId);
          const slugInput = closeNoteConfig.element[0].querySelector("input[name='slug']");
          const slug = slugInput.value;
          if (slug && slug.trim() !== "" && slug !== closeNoteConfig.document.flags.ddb?.slugLink) {
            logger.debug("Saving anchor slug", {
              slug,
              note: note,
              noteId: note._id,
            });
            await saveSlug(note, slugInput.value);
          }
        }
      });
    });
  });

  Hooks.on("dropCanvasData", (_, dropData) => {
    if (dropData.type !== "JournalEntryPage" && !dropData.anchor?.slug) return;

    // when we create from the side bar we fill in the input label name to match
    // the anchor name and set the slug value to the anchor slug
    Hooks.once("renderNoteConfig", (noteConfig) => {
      const titleInput = noteConfig.element[0].querySelector("input[name='text']");
      titleInput.setAttribute('value', dropData.anchor.name);
      if (dropData.anchor.slug) updateSlugField(noteConfig.element[0], dropData.anchor.slug);
    });
  });
}
