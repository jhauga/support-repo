# Normie Glossary: Slang to Real Concepts

People describe this stuff in everyday words. This table maps the casual phrase to what it actually is, so the AI can keep helping without making the user feel dumb. Slang is welcome; just translate and continue.

## Core Pieces

| What people say | What it really is | Plain meaning |
|-----------------|-------------------|---------------|
| "the robot", "the assistant", "the AI" | The AI desktop app | The app you chat with, like Claude Desktop |
| "the helper", "the toolbelt", "the plugin thing" | The MCP server | The program that gives the AI extra abilities |
| "the robot's menu", "the buttons it can press" | Tools | The actions the server can do (search, propose, save) |
| "the robot's memory folder", "where it keeps my stuff" | Resources | The saved files: your logs, current plan, attachments |
| "fill-in-the-blank", "the form" | Prompt | A ready-made starting template for a task |
| "the thing that opens stuff" | `to-explorer` | The package that opens a page, file, or program for you |
| "the secret handshake", "how they talk" | MCP | The agreed format the AI and the server use to talk |

## Setup Words

| What people say | What it really is | Plain meaning |
|-----------------|-------------------|---------------|
| "the black box", "the command window" | Terminal | Where you type commands |
| "install the parts", "download the bits" | `npm install` | Fetches everything the server needs |
| "build it", "make the real file" | `npm run build` | Turns the source into the runnable file |
| "the engine", "the thing that runs it" | Node.js | The runtime that runs the server |
| "the settings file", "the list of helpers" | `claude_desktop_config.json` | The config that tells the AI app about servers |
| "turn it off and on again" | Restart the AI desktop app | Quit fully and reopen so it reloads settings |

## Vacation Workflow Words

| What people say | What it really is | Plain meaning |
|-----------------|-------------------|---------------|
| "find me stuff to do" | `searchActivities` tool | Looks up activities near a place and date |
| "make me a plan", "lay out the days" | `proposeSchedule` tool | Builds a day-by-day proposed schedule |
| "let me sign in / pay" | `openForUser` tool | Opens the page so you enter login or payment yourself |
| "save it", "lock it in" | `recordActivity` tool | Writes the confirmed plan into the Vacations folder |
| "start over", "clean slate" | `resetPlanner` tool | Clears the plan so you can plan a new trip |
| "my trip notes", "the history" | `vacation://logs` resource | The running log of past plans |
| "what we have so far" | `vacation://current-plan` resource | The in-progress plan |

## A Note on Tone

When a user speaks casually, answer in the same friendly register, then quietly use the correct tool or step. Do not lecture. The goal is plug-and-play: the user describes what they want, and the AI maps it to the right action.
