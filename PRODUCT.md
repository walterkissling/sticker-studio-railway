# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are kids making stickers, often with a parent nearby on a phone or laptop. Confirmed by Walter 2026-09-15: this is a kids' site. Job: describe or upload a design, see it as a sticker, fill an A4 sheet, pay.

Adults (Walter as operator; paying parent) complete email gate and PayPal. Inferred: kids drive generate/edit; parent pays.

## Product Purpose

Sticker Studio is a small Costa Rica shop. A visitor describes a sticker (type or speak EN/ES), gets an AI drawing, edits it, mixes designs onto one A4 sheet, and pays ₡2,000 ($4 USD) via PayPal. Success: a paid print-ready sheet without burning Gemini on anonymous spam.

## Positioning

One-page studio: AI draw, sheet layout, and pay in the same place. No account beyond an email gate. Neighboring generators stop at the PNG.

## Operating Context

Used at home in Costa Rica, English or Spanish. Email first (20 AI designs per email and per IP per day). Orders email Walter a print PDF. No database. Local and Railway.

## Capabilities and Constraints

- Generate, edit, upload, history. Sheet size (medium 7×7cm ×8 or large 10×10cm ×4) is chosen at buy, not while drawing.
- Color-in mode: line-art pages, paid on the same ₡2,000 sheet as stickers (same 20/day cap)
- Email gate; leads in `data/leads.json`
- PayPal $10 USD when keys are set; unpaid submit until then
- Keep every JS-bound id and `server.js` payment/lead logic
- Single file UI: `public/index.html`
- No Chinese-origin models

## Brand Commitments

Name: Sticker Studio. Binding 2026-09-15: kids' site. Cutting-table look is rejected. Old purple/Poppins look is rejected.

## Evidence on Hand

Live UI at `public/index.html`. No real customer photos or testimonials. Do not invent reviews, print photos, or kid faces presented as real customers.

## Product Principles

- Kids can finish a sheet without reading a manual
- Parents see price and email before money moves
- Family-safe prompts only
- Do not spend Gemini without an email
- Honest price: ₡2,000 · $4 USD per sheet
