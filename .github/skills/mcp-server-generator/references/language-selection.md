# Choosing a Language for Your MCP Server

You do not have to be a programmer to read this. The short version: use TypeScript on Node. The rest explains why, and what the other choices would mean, in plain language.

## The Default: TypeScript on Node

TypeScript runs on Node, the same engine that powers a huge part of the web. For the vacation-activity server it is the easiest path because:

- The server depends on `to-explorer`, the package that opens a web page, file, or program for you so you can sign in or pay yourself without the terminal freezing. `to-explorer` is a Node package, so on Node you get it for free.
- One toolbox. Install Node once and you have everything: the runtime, the installer (`npm`), and the build step.
- The most copy-paste help exists for Node MCP servers, so getting unstuck is easier.
- It works the same on Windows, macOS, and Linux.

If you have no strong reason to pick something else, stop here and use TypeScript.

## The Other Languages, In Plain Terms

Each of these can build an MCP server, but each adds setup steps and none gives you `to-explorer` automatically. They make sense only if you already live in that world.

| Language | Think of it as | Good when | Trade-off for a normie |
|----------|----------------|-----------|------------------------|
| TypeScript / Node | The friendly all-rounder | Almost always, and required-friendly here | None worth noting; this is the pick |
| Python | The approachable lab notebook | You already use Python for data or scripts | Separate install and packaging; no `to-explorer` |
| Go | The compact speed machine | You want one fast standalone file | New toolchain to learn; more upfront setup |
| Rust | The careful safety expert | You need top speed and strictness | Steepest learning curve; slow to build |
| Java | The corporate workhorse | Your workplace already runs Java | Heavy setup, lots of configuration |
| Kotlin | The modern cousin of Java | You like Java but want it tidier | Same heavy Java-style toolchain |
| PHP | The classic web-page language | You run a PHP website already | Less common for MCP; extra wiring |
| Ruby | The readable scripter | You enjoy Ruby's style | Smaller MCP community; separate setup |
| Swift | The Apple specialist | You build for Mac or iPhone | Best on Apple gear; awkward elsewhere |

## How to Decide

Ask yourself one question: "Do I already use one of these other languages every day?"

- If no: use TypeScript. It is the least to install and the only one that bundles `to-explorer`.
- If yes and it is Python: Python is a reasonable second choice for general comfort, but you would still need a separate way to open pages for sign-in and payment.
- If yes and it is anything else: you can do it, but expect more setup and no free `to-explorer`.

## Why Not Just Pick the Fastest Language?

Speed almost never matters for this server. It spends its time waiting for you and for websites, not crunching numbers. Picking Rust or Go for raw speed buys you nothing here and costs you setup time. Easy beats fast for a vacation planner.
