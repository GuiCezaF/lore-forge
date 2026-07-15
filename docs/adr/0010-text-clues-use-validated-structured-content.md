# Text clues use validated structured content

Text Clues persist validated TipTap/ProseMirror JSON as their canonical content instead of HTML or Markdown. The API accepts only the agreed constrained schema, while player-visible HTML and plain text for previews or search are derived outputs. This keeps semantic editor content independent from Clue Style, prevents arbitrary active markup from becoming trusted data, and preserves reliable round-trip editing.
