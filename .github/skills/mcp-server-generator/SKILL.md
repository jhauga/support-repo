---
name: mcp-server-generator
description: 'Plain-language, plug-and-play guide that helps non-technical people create and run an MCP server, defaulting to the TypeScript/Node vacation-activity server. Use when someone says they want to "set up the robot helper", "make an MCP server", "get the vacation planner working", "install the thing", connect a server to Claude or another AI desktop app, or pick a programming language for a server. Tolerant of casual slang. Keywords: MCP server, setup, install Node, npm install, npm run build, claude_desktop_config.json, normie, beginner, plug and play, vacation-activity, to-explorer.'
---

# MCP Server Generator (Plain-Language Edition)

This skill helps a non-technical person get an MCP server running with as little fuss as possible. It assumes zero coding background and welcomes casual wording. When someone uses slang, translate it (see `references/normie-glossary.md`) and keep going.

## When to Use This Skill

- Someone wants to "set up the robot helper" or "get the vacation planner working"
- Someone asks how to make or install an MCP server but is not a programmer
- Someone needs to connect a server to an AI desktop app (Claude Desktop or similar)
- Someone asks which programming language to use for their server

## What Is an MCP Server (No Jargon)

Think of your AI desktop app as a smart assistant. By itself it can only talk. An MCP server is like a toolbelt you clip onto the assistant so it can actually do things - look stuff up, remember notes, open a web page for you.

Helpful pictures:

- The server is a helper that sits next to your AI and answers when the AI asks it to do a job.
- "Tools" are the buttons on the helper's menu (search for activities, propose a schedule).
- "Resources" are the helper's memory folder (where it keeps your saved plans and logs).
- A "prompt" is a fill-in-the-blank form the AI can use to start a task.
- MCP just means "the agreed-upon way the AI and the helper talk to each other." You do not need to understand the wiring, only how to plug it in.

For the vacation-activity server specifically, the menu (tools) is: find activities, propose a schedule, open something so you can sign in or pay yourself, save a confirmed plan, and start over for a new trip.

## Pick a Language (Short Answer: TypeScript)

Use TypeScript on Node. That is the recommended default here because the vacation-activity server depends on `to-explorer`, which is a Node package ("the thing that opens stuff" so you can sign in or pay without the terminal freezing). Staying on Node means everything is in one toolbox and there is the least to install.

Other languages are possible - Go, Java, Kotlin, PHP, Python, Ruby, Rust, Swift all have MCP support - but they add moving parts and would not get `to-explorer` for free. For the full plain-language comparison and why TypeScript wins here, see `references/language-selection.md`.

## Step-by-Step: Get the Vacation Server Running

Follow these in order. Each is meant to be copy-paste simple.

1. Install Node. Go to the official Node.js website, download the LTS version for your computer, and run the installer with the default choices. Node comes with `npm`, which installs the rest for you. To check it worked, open a terminal and run `node --version` - a version number means you are good.
2. Open a terminal in the server folder. The server lives in the `server/` folder of this project. Open a terminal there (in many apps you can right-click the folder and choose "Open in Terminal").
3. Install the parts. Run `npm install`. This downloads everything the server needs, including `to-explorer`. Wait for it to finish.
4. Build it. Run `npm run build`. This turns the source into the runnable file at `server/build/index.js`.
5. Tell your AI desktop app about the server. Add the server to your app's config file (for Claude Desktop that is `claude_desktop_config.json`). Step-by-step config with example paths for Windows, macOS, and Linux is in `references/claude-desktop-config.md`.
6. Restart the AI desktop app. Fully quit and reopen it so it picks up the new config. The vacation-activity server should now appear as available, and you can start planning.

You can also run the server by hand to check it starts: `node server/build/index.js`. It will sit quietly waiting for the AI to talk to it; that is normal. Close it with Ctrl+C.

## Prerequisites

- A computer running Windows, macOS, or Linux
- Node.js LTS installed (step 1 above) - this provides `node` and `npm`
- An AI desktop app that supports MCP servers (such as Claude Desktop)

## Gotchas

- **Always restart the AI desktop app after changing the config.** It only reads the config when it starts, so changes are invisible until you relaunch.
- **Use a full, absolute path to `index.js` in the config, not a shortcut.** A relative path or `~` may not resolve, and the server will silently fail to load. See `references/claude-desktop-config.md`.
- **On Windows, use forward slashes or doubled backslashes in JSON paths.** A single backslash like `C:\Users` breaks JSON. Write `C:/Users/...` or `C:\\Users\\...`.
- **Run `npm install` before `npm run build`.** Building without installing first fails because the parts are not downloaded yet.
- **The terminal looking "stuck" after `node server/build/index.js` is normal.** The server waits silently for the AI. It is not frozen.
- **Never type your password or card number into the AI.** When a booking needs a login or payment, the server opens the page for you so you enter it yourself. The AI must never handle those details.
- **The config file is strict JSON.** A missing comma or stray comment will stop the whole app from loading servers. Validate it if the server does not appear.

## Troubleshooting

| Problem | Try this |
|---------|----------|
| `node` or `npm` "not recognized" | Reinstall Node LTS and reopen the terminal so it picks up the new install |
| Server does not show up in the AI app | Check the path in the config, fix the slashes, then fully restart the app |
| App will not start after editing config | The JSON is broken; paste it into a JSON validator and fix the error |
| `npm run build` errors about missing modules | Run `npm install` first, then build again |
| Booking page never opens | Make sure `npm install` finished so `to-explorer` is present, and a default browser is set |

## References

- `references/language-selection.md` - plain-language trade-offs of each language and why TypeScript is the default
- `references/normie-glossary.md` - casual slang translated into the real concepts
- `references/claude-desktop-config.md` - how to register the server in an AI desktop config on Windows, macOS, and Linux
