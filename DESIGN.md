---
name: Sticker Studio
description: An open illustrated metal lunchbox on a sky gingham tablecloth. Stickers slap onto the sky enamel lid; the kid builds in the white enamel tray; the chrome-and-red latch makes it.
colors:
  cloth: "#F3F9FD"
  cloth-check: "rgba(79, 168, 224, 0.16)"
  ketchup: "#D8232F"
  ketchup-deep: "#A9161F"
  ketchup-ink: "#8C1119"
  ketchup-shine: "#EE4A54"
  mustard: "#F3B41B"
  mustard-deep: "#C58A08"
  mustard-soft: "#FBE7A8"
  sky: "#4FA8E0"
  navy: "#10304A"
  chrome-1: "#FFFFFF"
  chrome-2: "#D5DBE1"
  chrome-3: "#8E98A3"
  chrome-4: "#5C6670"
  enamel: "#FFFFFF"
  enamel-2: "#F1F4F7"
  ink: "#1E1B18"
  ink-2: "#5A544D"
  slot-guide: "rgba(30, 27, 24, 0.22)"
  lid-glass: "rgba(255, 255, 255, 0.28)"
  lid-paper: "rgba(255, 255, 255, 0.92)"
  scrim: "rgba(16, 48, 74, 0.55)"
  ok-bg: "#DDF3DF"
  ok-ink: "#1F5A2A"
  warn-bg: "#FFF0C2"
  warn-ink: "#6A4A00"
  err-bg: "#FFE0E0"
  err-ink: "#8E1A1A"
typography:
  display:
    fontFamily: "Lilita One, Baloo 2, Trebuchet MS, sans-serif"
    fontSize: "clamp(1.75rem, 1.2rem + 2vw, 2.5rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.01em"
  headline:
    fontFamily: "Lilita One, Baloo 2, Trebuchet MS, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "normal"
  title-large:
    fontFamily: "Lilita One, Baloo 2, Trebuchet MS, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.02em"
  title:
    fontFamily: "Lilita One, Baloo 2, Trebuchet MS, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.01em"
  emphasis:
    fontFamily: "Baloo 2, Trebuchet MS, Segoe UI, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Baloo 2, Trebuchet MS, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  button:
    fontFamily: "Baloo 2, Trebuchet MS, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "normal"
  label:
    fontFamily: "Baloo 2, Trebuchet MS, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "normal"
  caption:
    fontFamily: "Baloo 2, Trebuchet MS, Segoe UI, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
rounded:
  hairline: "2px"
  paper: "3px"
  hinge: "6px"
  r-1: "10px"
  thumb: "12px"
  r-2: "14px"
  modal-image: "16px"
  r-3: "18px"
  modal-compact: "20px"
  handle: "21px"
  sticker: "22px"
  r-4: "26px"
spacing:
  2xs: "6px"
  xs: "8px"
  sm: "10px"
  md: "12px"
  lg: "14px"
  xl: "16px"
  2xl: "18px"
  3xl: "26px"
components:
  latch:
    backgroundColor: "{colors.ketchup}"
    textColor: "{colors.enamel}"
    typography: "{typography.title-large}"
    rounded: "{rounded.r-3}"
    padding: "0 18px"
    height: "60px"
    width: "100%"
  latch-hover:
    backgroundColor: "{colors.ketchup-deep}"
    textColor: "{colors.enamel}"
  button-order:
    backgroundColor: "{colors.ketchup}"
    textColor: "{colors.enamel}"
    typography: "{typography.button}"
    rounded: "{rounded.r-2}"
    padding: "0 18px"
    height: "48px"
  button-order-hover:
    backgroundColor: "{colors.ketchup-deep}"
    textColor: "{colors.enamel}"
  button-enamel:
    backgroundColor: "{colors.enamel}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.r-2}"
    padding: "0 18px"
    height: "48px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    padding: "8px"
  chip-style:
    backgroundColor: "{colors.enamel}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.r-1}"
    padding: "9px 6px"
  chip-style-active:
    backgroundColor: "{colors.mustard}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.r-1}"
    padding: "9px 6px"
  size-card:
    backgroundColor: "{colors.enamel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r-2}"
    padding: "10px 12px"
  size-card-active:
    backgroundColor: "{colors.mustard}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r-2}"
    padding: "10px 12px"
  input:
    backgroundColor: "{colors.enamel}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.r-2}"
    padding: "12px 14px"
  well:
    backgroundColor: "{colors.enamel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r-3}"
    padding: "14px 16px 16px"
  lid-face:
    backgroundColor: "{colors.sky}"
    textColor: "{colors.navy}"
    rounded: "{rounded.r-3}"
    padding: "14px"
  sticker:
    backgroundColor: "{colors.enamel}"
    rounded: "{rounded.sticker}"
    padding: "12px"
  nameplate:
    backgroundColor: "{colors.mustard}"
    textColor: "{colors.ketchup-ink}"
    typography: "{typography.display}"
    rounded: "{rounded.r-2}"
    padding: "12px 38px 10px"
  price-tag:
    backgroundColor: "{colors.enamel}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.r-1}"
    padding: "8px 14px 8px 30px"
  trial-badge:
    backgroundColor: "{colors.mustard}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.r-1}"
    padding: "5px 12px"
  modal:
    backgroundColor: "{colors.enamel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r-4}"
    padding: "26px 28px 28px"
  status:
    backgroundColor: "{colors.enamel}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.r-2}"
    padding: "12px 14px"
---

# Design System: Sticker Studio

## Overview

**Creative North Star: "The Open Lunchbox"**

The page is an open illustrated metal lunchbox lying on a sky gingham tablecloth. The box is ketchup red enamel with a chrome rim and four corner rivets. Its two hard halves are joined by a vertical chrome hinge: the tray on the left is white enamel with molded wells where the kid describes, picks a style and a size, and presses the latch; the lid on the right is sky enamel with a printed sunburst, and that is where the sticker sticks. Above the box a chrome handle arcs over a riveted mustard nameplate. Below it the sticker stash is a second enamel tin with a sky interior.

Everything a kid reads is set in Baloo 2; everything printed on the tin (nameplate, compartment titles, the latch, prices, modal headings) is Lilita One. Every design is shown as a sticker: a thick white kiss-cut border, tilted -3deg, that slaps onto the lid with an overshoot. Mustard is the one live colour; it appears only where something is selected, listening, in use, or focused. The world replaces the rejected print-shop cutting table (sage mat, CutContour magenta, Bricolage Grotesque) and the earlier purple SaaS look wholesale.

**Key Characteristics:**
- Ketchup enamel box with chrome rim and rivets on a sky gingham cloth
- Two hard halves, tray and lid, joined by a chrome hinge; never two equal cards
- Mustard alone owns every live and selected state
- Lilita One tin lettering, Baloo 2 for reading
- Every design is a white-bordered sticker tilted -3deg that slaps into place
- Hardware has thickness: latch, buttons, rim and nameplate are drawn with chrome lips and pressed states

## Colors

Ketchup, mustard and sky on white enamel and chrome, grounded by warm ink and cool navy.

### Primary
- **Ketchup** (`ketchup`): the box body, the latch, the Order button, compartment titles, prices, the caret, and the filled cells of an active size schematic. `ketchup-shine` is the top highlight of the body and handle; `ketchup-deep` is the body's lower edge, hover fill and pressed lip; `ketchup-ink` is the nameplate lettering and the latch's deepest hover.

### Secondary
- **Mustard** (`mustard`): the single live accent. Active style chip, active size card, active language, listening mic, in-use sheet thumbs, the thumb `+`/`−` hover fill, the focus ring, the nameplate, the stickers-left badge, and the loading plotter bar. `mustard-deep` edges the active chip and the listening mic; `mustard-soft` is the input focus halo, the upload hover fill and text selection.

### Tertiary
- **Sky** (`sky`): the lid interior, the stash interior and the sheet-builder bench, always carrying a white sunburst or top sheen. `navy` is the text colour on sky (lid title, placeholder copy, slot counter, history labels) and the tint of every cool shadow and the modal scrim.

### Neutral
- **Cloth** (`cloth`, `cloth-check`): page ground, a 16px gingham drawn with two repeating gradients.
- **Chrome** (`chrome-1` to `chrome-4`): the hardware ramp. `chrome-1` is the specular white, `chrome-2` the rest border on inputs, chips, cards and the inner rim, `chrome-3` the hover border, dashed upload edge and mini-sheet stroke, `chrome-4` the outer rim and every pressed lip. Gradients `chrome` (vertical, for the mic) and `chrome-v` (horizontal, for the hinge) are built from the same four stops.
- **Enamel** (`enamel`, `enamel-2`): white enamel for wells, cards, inputs, stickers and modals; `enamel-2` is the recessed track behind segmented toggles.
- **Ink** (`ink`, `ink-2`): warm near-black for reading; `ink-2` for hints, placeholders, labels on tags and the text button.
- **Slot guide** (`slot-guide`): the faint dashed guide of an empty A4 slot.
- **Lid glass / lid paper** (`lid-glass`, `lid-paper`): translucent white for the empty placeholder and the loading sticker on the sky lid.
- **Scrim** (`scrim`): the modal overlay.
- **Status pairs** (`ok`, `warn`, `err`): tinted ground plus matching ink for the status strip and the badge's warning and expired states.

### Named Rules
**The Mustard Is Live Rule.** Mustard means selected, listening, in use or focused. It never fills a resting surface other than the nameplate and the stickers-left badge, and no other colour marks a live state.

**The Two Halves Rule.** Tray and lid are different materials: white enamel wells with an inner shadow versus sky enamel with a sunburst. They are never styled as two matching cards.

## Typography

**Display Font:** Lilita One (with Baloo 2, Trebuchet MS fallback)
**Body Font:** Baloo 2 (with Trebuchet MS, Segoe UI fallback)

**Character:** Tin-print lettering over a round, friendly reading face. Lilita One is used at its single weight (400) and never bolded; Baloo 2 carries all emphasis through weight (600, 700, 800). Headings use `text-wrap: balance`; numbers use tabular figures.

### Hierarchy
- **Display** (Lilita One 400, `clamp(1.75rem, 1.2rem + 2vw, 2.5rem)`, line-height 1, 0.01em): the nameplate only, ketchup-ink with a 1px white text-shadow.
- **Headline** (Lilita One 400, 1.75rem, line-height 1.1): modal titles and the sheet price, in ketchup.
- **Title large** (Lilita One 400, 1.375rem, 0.02em): the latch label and the stash title.
- **Title** (Lilita One 400, 1.125rem, line-height 1.2, 0.01em): compartment titles on wells (ketchup) and on the lid (navy).
- **Emphasis** (Baloo 2 800, 1.125rem): the promise (700), the price in the tag, the stickers-left count, placeholder copy on the lid, thumb `+`/`−` glyphs.
- **Body** (Baloo 2 400, 1rem, line-height 1.45): copy, inputs, modal copy.
- **Button** (Baloo 2 800, 1rem): every enamel or ketchup button and the size name.
- **Label** (Baloo 2 700, 0.875rem): field labels, hints, chips, tag, badge, status strip, summary rows, text button, language toggle (800, 0.04em).
- **Caption** (Baloo 2 600, 0.78rem, tabular): size dimensions, per-sheet counts, history labels (700).

### Named Rules
**The Tin Print Rule.** Lilita One is reserved for what would be printed on the tin: nameplate, compartment titles, the latch, prices and modal headings. It is never used for sentences, buttons other than the latch, or labels.

## Layout

Container max 1120px with 20px gutters (18px top, 64px bottom). The top bar is a three-column grid (`1fr auto 1fr`): promise left (max 22ch), handle-and-nameplate centre, price tag and stickers-left badge right, all aligned to the bottom. The box follows at -4px so the nameplate overlaps its rim. Inside the box a three-column grid (`minmax(0,1fr) 30px minmax(0,1fr)`) holds tray, hinge and lid. The tray stacks wells at a 12px gap; the lid holds the sky face over an enamel actions well. The stash is a full-width tin below at 26px margin. Modals are 440px (gate, edit) and 800px (sheet builder).

Sheet builder: 260px sheet column plus a fluid designs column at a 26px gap. The A4 keeps `aspect-ratio: 210 / 297`; slots are 33.333% (medium) or 47.619% (large) of sheet width with 0.952% column gap and 0.673% row gap, centred to match the server PDF.

Breakpoints: 900px collapses the box to one column (lid first, horizontal 26px hinge, tray last) and the top bar to two columns with the brand spanning; 640px tightens padding, drops the box radius to 22px and modals to 20px, stacks the sheet builder with a 62% wide sheet, and gives Order a full row; 420px stacks the top bar and drops style chips to two columns.

Spacing rhythm: 6, 8, 10, 12, 14, 16, 18, 26px. Wells pad 14px 16px 16px; modals 26px 28px 28px.

## Elevation & Depth

Depth is physical. Recessed surfaces (wells, lid face, stash interior, sheet bench) carry inner shadows; raised hardware (box, latch, buttons, nameplate, mic) carries chrome rims and hard lips; stickers carry a warm paper shadow. Warm shadows use ink `rgba(30, 27, 24, a)`; cool shadows and the scrim use navy `rgba(16, 48, 74, a)`; specular highlights are white at 0.25 to 0.55.

### Shadow Vocabulary
- **Well** (`inset 0 2px 6px rgba(30, 27, 24, 0.18), inset 0 -1px 0 rgba(255, 255, 255, 0.9)`): every enamel well and the lid actions well.
- **Lid recess** (`inset 0 3px 8px rgba(16, 48, 74, 0.45), inset 0 -2px 0 rgba(255, 255, 255, 0.3)`): the sky lid face; the stash interior and sheet bench use the 0.4 variant without the bottom highlight.
- **Sticker** (`0 1px 1px rgba(30, 27, 24, 0.12), 0 10px 20px -8px rgba(30, 27, 24, 0.45)`): every sticker on the lid, in the stash and in the edit modal.
- **Box** (`0 2px 0 rgba(30, 27, 24, 0.08), 0 26px 40px -22px rgba(16, 48, 74, 0.55)`): the lunchbox on the cloth, stacked after its chrome rim rings.
- **Modal** (`0 4px 6px rgba(16, 48, 74, 0.12), 0 36px 70px -28px rgba(16, 48, 74, 0.6)`): dialogs, stacked after an inner chrome rim and an 8px ketchup ring.
- **Chrome rim** (`0 0 0 3px chrome-2, 0 0 0 4px chrome-4` or `4px/6px` on the box): the rim of the handle, nameplate, box and latch, drawn as spread-only rings.
- **Hardware lip** (`0 2px 0 chrome-3|chrome-4|ketchup-deep`, `0 5px 0 5px chrome-4` on the latch): the thickness of a pressable control. Pressing translates the control down by the lip height and removes the lip.

### Named Rules
**The Recess or Rim Rule.** A surface is either recessed (inner shadow, no border) or hardware (chrome rim or lip, outer shadow). Nothing carries both an inner recess and an outer drop shadow.

**The Press Rule.** A pressed control moves down by exactly its lip (2px buttons, 3px modal latch, 4px main latch) and its lip disappears. Hover never lifts; it darkens the fill or the border.

## Shapes

Rounded squares throughout. Radius scale: 2px hairline schematic cells and the plotter bar, 3px paper (A4 sheet and mini-sheet), 6px the hinge and the tag's punched end, 10px chips, toggles, badge and mic, 12px sheet thumbs, 14px inputs, cards, buttons, nameplate and history stickers, 16px the edit-modal sticker, 18px wells and lid face, 20px modals under 640px, 21px the handle (the one pill: 42px tall), 22px the lid sticker, placeholder and loading sticker (and the box under 640px), 26px the box, stash and modals. Rivets, handle ends and the tag's hole are 50% circles; A4 slots are 9% of their width with 7% images inside.

Borders are 2px chrome (`chrome-2` at rest, `chrome-3` on hover, `mustard-deep` when active) on inputs, chips and cards; 2px dashed `chrome-2` separators; 2px dashed `chrome-3` on the upload strip; 3px dashed white on the empty lid placeholder; 1.5px dashed `slot-guide` on empty A4 slots. Stickers are white padding (5px thumbs, 6px stash, 8px edit, 12px lid) around the image. Tilt vocabulary: stickers -3deg, active chip -2deg with 1.04 scale, stash stickers alternate ±2deg, tag +1.5deg, badge -1.5deg.

## Components

Tactile hardware a kid can press, on enamel a kid can read.

### Buttons
- **Shape:** rounded square (14px); 48px tall; Baloo 2 800 at 1rem; 0 18px padding; no border.
- **Latch** (`latch`): the make action. Full width, 60px, Lilita One 1.375rem in white on a ketchup gradient (`ketchup` to `ketchup-deep`), 18px radius, chrome rim (4px `chrome-2`, 5px `chrome-4`), a 5px `chrome-4` lip and an inner white highlight. Hover deepens to `ketchup-deep` to `ketchup-ink`; active drops 4px and shortens the lip to 1px; disabled desaturates (`saturate(0.6)`) with a wait cursor. In modals it is 52px, 14px radius, with a 3px `ketchup-deep` lip.
- **Order** (`button-order`): ketchup fill, white text, 2px `ketchup-deep` lip. Hover to `ketchup-deep`; active drops 2px; disabled at 0.5 opacity.
- **Enamel** (`button-enamel`, New / Edit / Cancel): white with an inset 2px `chrome-2` ring and 2px `chrome-3` lip; hover to `chrome-3` ring and `chrome-4` lip; active drops 2px.
- **Text** (`button-text`, Download PNG): `ink-2` underlined in `chrome-3`, 2px thick, 4px offset; hover to `ink` with a ketchup underline.
- **Mic**: 38px square, 10px radius, `chrome` gradient with a 1px `chrome-4` ring and 2px lip; listening turns mustard with a `mustard-deep` lip and a 2px mustard ring pulsing outward (1.2s).

### Chips
- **Style chips** (`chip-style`): 4-column grid (3 under 640px, 2 under 420px) of white 10px-radius chips with a 2px `chrome-2` border, Baloo 2 700 at 0.875rem. Hover to `chrome-3` border.
- **Active** (`chip-style-active`): mustard fill, `mustard-deep` border, rotated -2deg and scaled 1.04 with a short warm shadow; the transform eases with `ease-slap`.
- **Segmented language toggle**: `enamel-2` track with an inset 2px `chrome-2` ring; buttons are 800-weight 0.875rem with 0.04em tracking in `ink-2`; the active language is a mustard fill with `ink` text.
- **Stickers-left badge** (`trial-badge`): mustard, 700 at 0.875rem with the count at 1.125rem 800, tilted -1.5deg; warning and expired swap to the `warn` and `err` pairs.

### Cards / Containers
- **Wells** (`well`): white enamel, 18px radius, `well` inner shadow, no border, 14px 16px 16px padding, a Lilita One title in ketchup.
- **Lid face** (`lid-face`): sky, 18px radius, top sheen plus a 9deg/18deg white conic sunburst centred at 50% 46%, `lid recess` shadow, 14px padding, navy title.
- **Size cards** (`size-card`): white, 14px radius, 2px `chrome-2` border, a 30px mini A4 with dashed `chrome-3` cells; active fills mustard with `mustard-deep` border and paints the cells solid ketchup.
- **Box**: ketchup gradient body with four chrome rivets drawn as radial gradients 16px from each corner, chrome rim (4px `chrome-2`, 6px `chrome-4`), `box` shadow, 26px radius, 16px padding.
- **Stash**: white enamel tin, 26px radius, inset chrome rim (3px `chrome-2`, 5px `chrome-4`), a sky interior grid (18px radius, `lid recess` 0.4) holding stickers at 112px minimum with alternating ±2deg tilt; hover straightens, scales 1.05 and adds a 3px mustard ring.
- **Price tag** (`price-tag`): white, 6px left / 10px right corners, a punched hole ringed in `chrome-2`, tilted +1.5deg, price in ketchup 800.
- **Modals** (`modal`): white enamel, 26px radius (20px under 640px), inset chrome rim, an 8px ketchup ring, `modal` shadow; enter with `translateY(14px) scale(0.98)` to rest over 280ms `ease-slap` behind a navy scrim.
- **Status strip** (`status`): 14px radius, 700 at 0.875rem, tinted ground with matching ink; info is white on `ink-2`.

### Inputs / Fields
- **Style:** white enamel, 2px `chrome-2` border, 14px radius, 12px 14px padding, 1rem Baloo 2; textareas 92px minimum with vertical resize; ketchup caret; `ink-2` placeholders.
- **Hover / Focus:** hover to `chrome-3` border; focus to a mustard border with a 3px `mustard-soft` halo and no outline. Global `:focus-visible` is a 3px mustard outline at 2px offset with a 10px radius.
- **Upload strip:** 2px dashed `chrome-3`, 14px radius, 700 at 0.875rem with an 18px stroke SVG; hover to `mustard-deep` dashes on `mustard-soft`.

### Navigation
- The top bar is the only navigation: handle and nameplate centred, promise left, tag and badge right. There is no menu. A skip link (ink on white, 10px radius) appears at 12px on focus.

### Sticker
Every design is an image padded in white enamel with the `sticker` shadow and tilted -3deg: 12px padding and 22px radius on the lid (max 330px), 6px and 14px in the stash, 8px and 16px in the edit modal (150px, with a 2px `chrome-2` ring), 5px and 12px as sheet thumbs (a 3px mustard ring when in use). A new design enters with `slap`: 480ms `ease-slap` from `scale(1.22) rotate(-9deg)` and 0 opacity to `scale(1) rotate(-3deg)`. The empty lid shows a 230px placeholder at the same tilt: 3px dashed white on `lid-glass`, 22px radius, navy 800 copy. Loading shows a 230px `lid-paper` sticker with a 4px mustard plotter bar sweeping 202px over 2.2s.

### A4 Sheet
One continuous white sheet (3px radius, cool paper shadow) at true 210/297 on a sky sunburst bench (18px radius, 16px padding). Empty slots are 1.5px dashed `slot-guide` at 9% radius; filled slots drop the border, pad 5% and hold a 7%-radius image with a 1px ink ring. A placed sticker enters with `slapFlat`: 420ms `ease-slap` from `scale(1.3) rotate(-8deg)`. The slot counter is navy 800 tabular at 0.875rem; the price is Lilita One 1.75rem ketchup.

Motion: two curves, `ease-out` (`cubic-bezier(0.2, 0.8, 0.2, 1)`, 120 to 220ms) for every state change and `ease-slap` (`cubic-bezier(0.34, 1.56, 0.64, 1)`, 160 to 480ms) for anything that lands: stickers, the active chip, stash hover, modal entry. `prefers-reduced-motion` removes all animation and transitions.

## Do's and Don'ts

### Do:
- **Do** show every design as a white-bordered sticker tilted -3deg with the `sticker` shadow, and land it with `slap` (`ease-slap`, 480ms) on the lid or `slapFlat` (420ms) on the sheet.
- **Do** keep mustard for live and selected states only: active chip, size, language, listening mic, in-use thumb, focus ring, nameplate and stickers-left badge.
- **Do** set tin lettering (nameplate, compartment titles, latch, prices, modal titles) in Lilita One 400 and everything else in Baloo 2 at 400, 600, 700 or 800.
- **Do** draw pressable hardware with a chrome rim or lip and press it down by its lip height; recess resting surfaces with an inner shadow.
- **Do** keep the A4 at 210/297 with 33.333% or 47.619% slots drawn as faint dashed guides on one continuous sheet.

### Don't:
- **Don't** style tray and lid as two equal cards; the tray is white enamel wells, the lid is sky enamel with a sunburst.
- **Don't** use a pill except the handle (21px on 42px); every other shape is a rounded square between 2px and 26px.
- **Don't** add glows, glass blur, gradients outside the enamel and chrome ramps, emoji, or icon tiles; icons are 2px stroke SVG at 18 to 20px.
- **Don't** put a second live colour anywhere, or use ketchup for a selected state.
- **Don't** rename or remove JS-bound ids (`emailGate`, `gateEmail`, `gateContinue`, `paypalButtons`, `sheetPreviewRow`, `historyGrid`, `styleGrid`, `sizeGrid` and the rest) when restyling.
