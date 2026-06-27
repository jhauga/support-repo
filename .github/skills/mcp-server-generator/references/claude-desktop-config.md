# Registering the Server in Your AI Desktop App

This shows how to add the vacation-activity server to an AI desktop app's config so the app can use it. The example uses Claude Desktop's `claude_desktop_config.json`; other MCP-aware apps use a similar file.

All paths below are placeholders. Replace `demo-user` and the folder names with your own. Keep the structure exactly as shown.

## Where the Config File Lives

| Operating system | Config file location |
|------------------|----------------------|
| Windows | `C:/Users/demo-user/AppData/Roaming/Claude/claude_desktop_config.json` |
| macOS | `/Users/demo-user/Library/Application Support/Claude/claude_desktop_config.json` |
| Linux | `/home/demo-user/.config/Claude/claude_desktop_config.json` |

If the file does not exist yet, create it. If it already has content, add the `vacation-activity` entry inside the existing `mcpServers` object rather than replacing the whole file.

## What to Add

The key is the path to the built server file `server/build/index.js`. Use the full absolute path.

### Windows

JSON does not allow a single backslash, so use forward slashes or doubled backslashes.

```json
{
  "mcpServers": {
    "vacation-activity": {
      "command": "node",
      "args": ["C:/Users/demo-user/Documents/GitHub/mcp-vacation-activity/server/build/index.js"]
    }
  }
}
```

### macOS

```json
{
  "mcpServers": {
    "vacation-activity": {
      "command": "node",
      "args": ["/Users/demo-user/Documents/GitHub/mcp-vacation-activity/server/build/index.js"]
    }
  }
}
```

### Linux

```json
{
  "mcpServers": {
    "vacation-activity": {
      "command": "node",
      "args": ["/home/demo-user/Documents/GitHub/mcp-vacation-activity/server/build/index.js"]
    }
  }
}
```

## Running via npx Instead

If the server is published as a package, you can let `npx` fetch and run it without a build path:

```json
{
  "mcpServers": {
    "vacation-activity": {
      "command": "npx",
      "args": ["-y", "vacation-activity-mcp-server"]
    }
  }
}
```

## After Editing

1. Save the file.
2. Fully quit the AI desktop app (do not just close the window).
3. Reopen it. The `vacation-activity` server should now be available.

## Common Mistakes

- Single backslashes in a Windows path break the JSON. Use `C:/...` or `C:\\...`.
- A relative path or `~` may not resolve. Use the full absolute path to `index.js`.
- A missing comma between entries makes the whole file invalid and no servers load.
- Forgetting to restart the app means the new server never appears.
- Pointing at the source file instead of the built `server/build/index.js`. Run `npm run build` first.
