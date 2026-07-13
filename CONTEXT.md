# LoreForge

LoreForge models reusable tabletop RPG content separately from the campaign-specific entities and state used during play.

## Characters

**Ruleset Version**:
An immutable set of game mechanics used to validate and calculate a character; LoreForge currently supports only the base Ordem Paranormal RPG 1.3 rules.
_Avoid_: Supplement, mixed rules

**NPC Template**:
A reusable, GM-owned definition of an NPC that exists independently of any campaign.
_Avoid_: Global NPC, campaign NPC

**Campaign NPC**:
An independently editable snapshot created from an NPC Template for use in one campaign; later changes never propagate between the template, this snapshot, or copies in other campaigns.
_Avoid_: NPC template, shared NPC

## Campaign Access

**Campaign GM**:
The single owner and game master of a campaign; a campaign cannot have co-GMs.
_Avoid_: Campaign manager, GM member

**Player Invitation**:
An invitation addressed to one identified user that reserves a player slot while pending and, when accepted, grants player membership without creating or attaching a character. The Campaign GM may cancel it, releasing the slot.
_Avoid_: Campaign invite, spectator invitation

**Campaign Player**:
A user who accepted a Player Invitation; the player may join before attaching a character, and each campaign supports at most nine Campaign Players.
_Avoid_: Invited player, character

**Campaign Character**:
A character sheet a Campaign Player attaches after joining; it remains permanently attached and is either active or archived.
_Avoid_: Player, unassigned sheet

**Active Campaign Character**:
The one Campaign Character currently used by a Campaign Player in a campaign.
_Avoid_: Selected character, current sheet

**Inactive Campaign Character**:
A Campaign Character paused because its player left or was removed; if the player rejoins, it may be reactivated or replaced with another character.
_Avoid_: Archived character, detached character

**Archived Campaign Character**:
A Campaign Character the GM has confirmed as retired or deceased, retained as campaign history and unavailable for automatic reactivation; archiving it allows its player to attach a replacement.
_Avoid_: Deleted character, detached character

**Permanent Sheet Data**:
Owner-managed character information such as identity, NEX, attributes, skills, and powers that defines the character independently of moment-to-moment play.
_Avoid_: Campaign state, inventory

**Character Edit Draft**:
An owner-only working revision that may temporarily contain choices made invalid by an edit; it does not replace the character's last valid Permanent Sheet Data until submitted successfully.
_Avoid_: Active character, autosaved character

**Campaign State**:
Campaign-specific, changing information such as current resources, conditions, temporary effects, rituals, and campaign inventory; it is not Permanent Sheet Data. A player controls their own character's resources while the GM controls Campaign NPC resources.
_Avoid_: Character build, permanent sheet

**Campaign Ritual**:
A rules-validated ritual learned by one Campaign Character in one campaign; its owner manages it and the GM may view it.
_Avoid_: Permanent ritual, inventory item

**Spectator Access**:
Anonymous, read-only access granted by a shareable campaign link and limited to content the GM explicitly publishes.
_Avoid_: Spectator membership, spectator invitation

**Published Campaign Content**:
Campaign information deliberately made visible through Spectator Access; it excludes private character data, GM notes, member details, editing controls, and invitation management.
_Avoid_: Player-visible content, public campaign
