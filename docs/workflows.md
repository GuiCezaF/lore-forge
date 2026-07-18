# LoreForge workflows

LoreForge uses a single Campaign GM and invitation-only Campaign Players. Anonymous spectators never become campaign members.

## Guided Character Creation

Players create a draft through the guided steps, selecting identity, origin, class, attributes, skills, powers, and NEX. The API validates the final build against the sheet's Ruleset Version and calculates derived values itself. A draft remains available after validation errors so the player can correct it before explicitly finalizing the sheet.

## Live Character Editing

Permanent Sheet Data is edited in a staged Character Edit Draft. The currently published sheet remains in use until the draft passes validation and the player explicitly publishes it. Campaign State is separate: a player can update the live resources of their own Active Campaign Character, and the server clamps them to the calculated maxima.

## Campaign Character Attachment and Lifecycle

After accepting an invitation, a player attaches one finalized sheet as their Active Campaign Character. Attachment is permanent to that campaign. Leaving or removal makes the active character inactive while retaining its campaign history. On return, the sheet may be reactivated; attaching a replacement archives the previous active character. Copying a sheet to another campaign carries only Permanent Sheet Data, never Campaign State, rituals, inventory, or history.

## Create NPC → Add to Campaign

The Campaign GM creates an NPC Sheet independently, then attaches that same sheet once to a campaign. An attached NPC cannot move to another campaign. Narrative NPCs remain sheets; threat NPCs have GM-controlled live state. NPC Sheets are archived for history instead of being detached or deleted from their campaign.

## Player Invitations and capacity

The Campaign GM invites a player using their LoreForge code. A pending invitation reserves capacity, and a campaign can have at most nine Campaign Players. Accepting adds membership only; it never creates or attaches a character. Declining, cancellation, and expiration release the reserved slot.

## Spectator Access

The Campaign GM can create a shareable spectator link. It anonymously publishes only the campaign name, description, and optional cover; it never reveals members, characters, Campaign State, invitations, private notes, or controls. Rotating or revoking the link invalidates its previous token immediately.

LoreForge is an unofficial tool and follows the Ordem Paranormal Community License v1.0.
