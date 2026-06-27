---
name: vacation-activity-planner
description: 'Plan, propose, schedule, and record day-by-day vacation activities using the vacation-activity MCP server. Use when a user wants to plan a trip, find things to do near a location, build a day-by-day itinerary, book or confirm activities, hand off for manual login or payment entry, log confirmed plans, or reset the planner for a new vacation. Keywords: vacation, trip, itinerary, activities, schedule, travel planning, openForUser, searchActivities, proposeSchedule, recordActivity, resetPlanner.'
---

# Vacation Activity Planner

Guide the user through planning daily vacation activities with the `vacation-activity` MCP server. The server exposes tools, resources, and a prompt; this skill explains how to drive them as one smooth workflow and where the human must stay in the loop.

## When to Use This Skill

- User wants to plan a vacation or find activities near a location
- User wants a day-by-day itinerary built and confirmed set by set
- User needs to book or confirm activities that require a login or payment
- User wants confirmed plans recorded, or wants to start planning a fresh trip

## Server Surface

- Tools: `searchActivities`, `proposeSchedule`, `openForUser`, `recordActivity`, `resetPlanner`
- Resources: `vacation://logs`, `vacation://current-plan`, `vacation://attachments`, and `vacation://activities/{activity}/{year}`
- Prompt: `plan-vacation-activity` (arguments: `location` required, `date` required, `duration`, `activities[]`)
- Storage folder: `%USERPROFILE%\Documents\Vacations` on Windows or `$HOME/Documents/Vacations` on POSIX

## Gathering Valid Inputs

Collect these from the user before calling tools. Do not invent values.

| Input | Required | Notes |
|-------|----------|-------|
| `location` | Yes | City, region, or place to search near (e.g., Springfield) |
| `activityDate` / `date` | Yes | A plannable day in `YYYY-MM-DD` (e.g., 2026-07-15) |
| `duration` | No | Number of trip days, used to derive the plannable range |
| `area` | No | Narrower area within the location |
| `activity` | No | A specific activity type (e.g., hiking, museums) |
| `vacationDate` | No | Overall vacation start used for history lookups |

Convert casual phrasing ("next weekend") into concrete dates and confirm with the user before proceeding.

## The One Workflow: Plan, Propose, Schedule

1. Start with the `plan-vacation-activity` prompt using `location`, `date`, and any optional `duration` and `activities`. This frames the planning conversation.
2. Call `searchActivities` with `location` and `activityDate`. It reads local history and may open candidate search URLs in the browser. Summarize what was opened so the user can review.
3. Call `proposeSchedule` with the location, dates or duration, and the chosen activities to build a day-by-day proposed schedule with variations.
4. Present each proposed set one day at a time and get explicit confirmation before advancing. Treat silence or ambiguity as "not yet confirmed".
5. For any step needing sensitive info, hand off with `openForUser` (see below). Pause until the user reports they are done.
6. Call `recordActivity` to write confirmed activities into the Vacations folder and append to `logs.md`.
7. Call `resetPlanner` when the user wants to plan a different trip so the same server is reusable plug-and-play.

## The Sensitive-Info Handoff

When a booking needs a login or a payment method, the AI coding agent hands off to the AI desktop agent so the human can act:

- Call `openForUser` with the URL, file, or program to open. It uses the `to-explorer` package to open the target detached, so the terminal is not blocked.
- Tell the user exactly what to do (sign in, enter card details) and that you will wait.
- Resume only after the user confirms they finished.

## Gotchas

- **Never auto-enter credentials or payment info.** Always hand off to the user with `openForUser`. The agent must not type, store, or transmit logins or card numbers.
- **Never use `console.log` in a stdio MCP server.** Writing to stdout corrupts the MCP message stream; log to stderr instead. This applies when extending or debugging the server.
- **Arrival and departure days are not plannable activity days.** They are travel days; exclude them from the schedule unless the user explicitly asks to plan around them.
- **Confirm every proposed set individually.** Do not batch-confirm or assume approval across days.
- **`activityDate` must be `YYYY-MM-DD`.** Reformat any other date style before calling tools.
- **Reset between trips.** Call `resetPlanner` before reusing the server for a new vacation, or stale plan state leaks into the new trip.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No activities returned | Loosen `area`/`activity`, verify `location` spelling, confirm `activityDate` is valid |
| Browser did not open candidates | Confirm a default browser is set and that `to-explorer` is installed for the server |
| Server output looks garbled in the host | A library is writing to stdout; route all logging to stderr |
| Plan from a previous trip shows up | Call `resetPlanner`, then start the workflow again |
| Sensitive step stalls | Re-open the target with `openForUser` and wait for the user to confirm completion |

## References

- See the `mcp-server-generator` skill to scaffold and run the server itself.
- Resources `vacation://logs` and `vacation://current-plan` hold prior history and the in-progress plan.
