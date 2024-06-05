console.warn("TEST MACRO RUN", {
  actor,
  token,
  item: (typeof item !== 'undefined') ? item : undefined,
  speaker: (typeof speaker !== 'undefined') ? speaker : undefined,
  origin: (typeof origin !== 'undefined') ? origin : undefined,
  scope,
  args: (typeof args !== 'undefined') ? args : undefined,
  workflow: (typeof workflow !== 'undefined') ? workflow : undefined,
  character: (typeof character !== 'undefined') ? character : undefined,
});
