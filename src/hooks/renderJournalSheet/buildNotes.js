function copyToClipboard(text) {
  var dummy = document.createElement("textarea");
  document.body.appendChild(dummy);
  dummy.value = text;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);
}

var clippy = {};

function getButton(name, type) {
  return $(
    `<a id='ddb-note-${name}' class='ddb-button'><i class='fas fa-clipboard-check'></i>&nbsp;Copy ${type} ${name} </a>`
  );
}

function buildNotes(html, data) {
  if (!game.user.isGM) return;
  const allow = game.settings.get("ddb-importer", "allow-note-generation");
  if (!allow) return;

  // mark all headers
  $(html)
    .find("h1, h2, h3, h4, h5, figure, p")
    .each((index, element) => {
      $(element).wrap("<div class='ddbimporter-note-container'></div>");
      // show the button on mouseenter
      $(element)
        .parent()
        .mouseenter(function Hovering() {
          const tagName = $(element).prop("tagName");
          const showStartButton = $(this).append(getButton("start", tagName));
          const showEndButton = $(this).append(getButton("end", tagName));
          $(showStartButton).click(() => {
            // const src = $(element).attr("src");
            clippy = {
              ddbId: data.entity.flags.ddb.ddbId,
              cobaltId: data.entity.flags.ddb.cobaltId,
              parentId: data.entity.flags.ddb.parentId,
              splitTag: tagName.toLowerCase(),
              slug: data.entity.flags.ddb.slug,
              tagIdFirst: $(element).prop("id"),
              contentChunkIdStart: $(element).attr("data-content-chunk-id"),
              tagIdLast: "",
              contentChunkIdStop: "EOF",
              sceneName: data.entity.name,
            };
            copyToClipboard(JSON.stringify(clippy, null, 2));
          });
          $(showEndButton).click(() => {
            clippy.tagIdLast = $(element).prop("id");
            clippy.contentChunkIdStop = $(element).attr("data-content-chunk-id");
            copyToClipboard(JSON.stringify(clippy, null, 2));
          });
        });
      $(element)
        .parent()
        .mouseleave(function Unhovering() {
          $(this).find("#ddb-note-start").remove();
          $(this).find("#ddb-note-end").remove();
        });
    });
}

export default buildNotes;
