# LoreForge

LoreForge models reusable tabletop RPG content separately from the campaign-specific entities and state used during play.

## Campaign Content

**Campaign Clue**:
A GM-owned piece of information prepared for one campaign and deliberately revealed during play; it may be presented as a document or another visual clue. It remains private to the Campaign GM unless visibility is granted explicitly.
_Avoid_: Document, campaign item, handout

**Archived Campaign Clue**:
A Campaign Clue removed from the GM's active collection after its active grant has been reclaimed; it can be restored but cannot be delivered while archived. It is retained for at most 60 days before its content and image are permanently purged.
_Avoid_: Deleted clue, granted clue

**Purged Clue Record**:
A minimal, GM-private tombstone retained after an Archived Campaign Clue reaches its 60-day limit, preserving identity and custody history but no player-visible content, style, accessibility metadata, or image.
_Avoid_: Archived clue, restorable clue, clue content

**Text Clue**:
A Campaign Clue whose player-visible content is authored as constrained rich text within LoreForge and presented with a Clue Style.
_Avoid_: Plain document, uploaded document

**Image Clue**:
A Campaign Clue whose complete player-visible presentation is supplied as an uploaded image instead of authored text, with a required accessible description and an optional transcription. Its media has exactly the same visibility as the Campaign Clue and is never public by direct URL.
_Avoid_: Clue attachment, text clue image

**Clue Style**:
A system-defined visual theme selected for a Text Clue that controls its presentation without changing its authored content.
_Avoid_: Editor formatting, image filter, custom CSS

**GM Clue Label**:
A required, private name used by the Campaign GM to organize a Campaign Clue; it may contain information that must never be revealed to players.
_Avoid_: Clue title, player-visible name

**Clue Title**:
An optional, player-visible heading for a Campaign Clue that is distinct from its GM Clue Label.
_Avoid_: GM clue label, internal name

**Clue Grant**:
A revocable, exclusive association that gives one Campaign Character read-only access to the current content of a Campaign Clue through campaign inventory without consuming carrying capacity; a Campaign Clue has at most one active grant. Only the Campaign GM may deliver, reclaim, or transfer it; a new recipient must be an Active Campaign Character, while an existing grant may remain administrable after its character becomes inactive or archived.
_Avoid_: Inventory item, permanent ownership, player grant

**Dormant Clue Grant**:
A Clue Grant retained for GM administration after its Campaign Character is no longer active; the player cannot access it or that character's Campaign Inventory. It becomes readable again only if an inactive character is reactivated before the clue is reclaimed or transferred; a grant on an archived character must be transferred to an active one.
_Avoid_: Revoked grant, former-player access, archived clue

**Clue Custody Event**:
An immutable, GM-private record that a Campaign Clue was delivered, reclaimed, or transferred, including the responsible user, affected characters, and time.
_Avoid_: Active clue grant, player notification, editable history

**Clue Board**:
A campaign-shared collection where players deliberately expose Campaign Clues to other Campaign Players.
_Avoid_: Campaign inventory, automatic clue sharing

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
A character sheet a Campaign Player attaches after joining; it remains permanently attached and is active, inactive, or archived.
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

**Campaign Inventory**:
The private collection of ordinary items and granted Campaign Clues held by one Campaign Character, visible to the Campaign GM and to its owner only while that owner remains a Campaign Player and the character is active. The Campaign GM manages its contents while the authorized character owner has read-only access, and Campaign Clues never contribute to its carried load.
_Avoid_: Permanent inventory, player inventory, shared campaign inventory

**Inventory Entry**:
A campaign-specific snapshot of an ordinary item held in a Campaign Inventory, recording its name, quantity, per-unit space, player-visible notes, and GM-private notes. It may originate from a catalog item, but later catalog changes do not propagate to it.
_Avoid_: Catalog item, clue grant, live item reference

**Inventory Load**:
The total space occupied by a Campaign Inventory, calculated as each ordinary item's quantity multiplied by its per-unit space and compared with the Campaign Character's carrying capacity.
_Avoid_: Item count, clue count, inventory capacity

**Overloaded Inventory**:
A valid Campaign Inventory whose Inventory Load exceeds the Campaign Character's carrying capacity; it is allowed but must be reported clearly.
_Avoid_: Invalid inventory, rejected item

**Campaign Ritual**:
A rules-validated ritual learned by one Campaign Character in one campaign; its owner manages it and the GM may view it.
_Avoid_: Permanent ritual, inventory item

**Spectator Access**:
Anonymous, read-only access granted by a shareable campaign link and limited to content the GM explicitly publishes.
_Avoid_: Spectator membership, spectator invitation

**Published Campaign Content**:
Campaign information deliberately made visible through Spectator Access; it excludes private character data, GM notes, member details, editing controls, and invitation management.
_Avoid_: Player-visible content, public campaign

**Play Session**:
A future GM-started period of live campaign play in which connected Campaign Players receive real-time updates.
_Avoid_: Campaign membership, campaign page, inventory view
