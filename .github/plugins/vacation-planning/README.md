# Vacation Planning Plugin

A Claude Code / GitHub Copilot plugin that plans, proposes, schedules, and records day-by-day vacation activities using the `vacation-activity` MCP server. It keeps the user in control of anything sensitive: when a booking needs a login or payment, the server opens the page so the user enters those details themselves.

## What Is Inside

| Piece | Path | Purpose |
|-------|------|---------|
| Command | `commands/plan-vacation-activity.md` | Runs the full plan-propose-schedule workflow |
| Skill | `skills/vacation-activity-planner/SKILL.md` | Guides planning, confirming, recording, resetting |
| Skill | `skills/mcp-server-generator/SKILL.md` | Plain-language, plug-and-play setup of the server |
| Agent | `agents/travel-activity.agent.md` | Travel planning specialist that checks tooling first |

## Install

1. Place this plugin folder where your AI tool discovers plugins.
2. Set up and run the vacation-activity MCP server. The `mcp-server-generator` skill walks a non-technical user through it: install Node, run `npm install`, run `npm run build`, then register the server in your AI desktop app config.
3. Restart your AI desktop app so it loads the server.

## Usage

- Run the slash command to plan a trip end to end:

  ```text
  /plan-vacation-activity
  ```

- Or just describe the trip in plain words. For example: "Find me things to do near Springfield on 2026-07-15 for three days." The agent and skills map that to the right tools.

## Workflow at a Glance

1. Gather `location`, a plannable `date` (`YYYY-MM-DD`), and optional `duration` and activities.
2. Search for activities, then propose a day-by-day schedule.
3. Confirm each proposed set, one day at a time.
4. For bookings, the server opens the page so you sign in or pay yourself.
5. Record the confirmed plan, and reset when you start a new trip.

## Prompt to Initialize

```md
---
description: 'Plan day-by-day vacation activities end to end using thevacation-activity MCP server - gather location, dates, and activities, propose options, confirm each set, hand off for manual login/payment entry, then record the plan.'
---

# Plan a Vacation Activity

Drive the full vacation activity planning workflow against the
`vacation-activity` MCP server. Load the `vacation-activity-planner`
skill first for the detailed process, then follow the steps below.

## Inputs to gather

Ask the user for these before calling any tool. Do not guess values.

- `location` (required) - the city, region, or place to find activities near.
 Example: Springfield.
- `date` (required) - the first plannable day in `YYYY-MM-DD` form.
 Example: 2026-07-15.
- `duration` (optional) - how many days the trip lasts. Used to derive the
 range of plannable days.
- `activities` (optional) - a list of activity types the user is interested in,
 such as hiking, museums, food tours.

If the user gives a casual phrase ("next weekend", "a few days in July"),
convert it to concrete `YYYY-MM-DD` dates and confirm the result with the user
before continuing.

## Workflow

1. Run the MCP prompt `plan-vacation-activity` with the gathered `location`,
 `date`, and optional `duration` and `activities`. This frames the planning
  conversation.
2. Call `searchActivities` with `location` and `activityDate` (and optional
 `area`, `activity`, `vacationDate`). It reads local history and may open
 candidate search URLs in the browser for the user to review.
3. Call `proposeSchedule` with the location, dates or duration, and chosen
 `activities` to build a day-by-day proposed schedule.
4. Present each proposed set of activities to the user one day at a time.
 Wait for explicit confirmation of each set before moving on. Do not assume a
 yes.
5. When a step needs sensitive info (login credentials, payment method), call
 `openForUser` to open the relevant URL, file, or program detached so the USER
 enters that info themselves. Pause and wait for the user to say they are done
 before continuing. Never type credentials or payment details on the user's
 behalf.
6. After all sets are confirmed and any bookings handled, call `recordActivity`
 to write the confirmed activity data into the Vacations folder and append to
 `logs.md`.
7. When the user is ready to plan a different trip, call `resetPlanner` to
 clear the working plan so the same server is reusable for a new vacation.

## Notes

- Arrival and departure days are travel days, not plannable activity days.
 Exclude them from the schedule unless the user explicitly asks otherwise.
- Surface what `searchActivities` opened in the browser so the user can review
 candidates before you propose a schedule.
- Read the resources `vacation://logs` and `vacation://current-plan` when you
 need prior history or the in-progress plan.
```
