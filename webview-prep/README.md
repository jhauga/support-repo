# WebView Prep

Generate interactive web previews of Rhino models using three.js. Export your models to STL, GLB, or 3DM format and view them in any web browser with proper Rhino-style navigation and Z-up orientation.

## Build and Install

### Build

Requirements:
- .NET 8 SDK
- Rhino 8 (8.20 or later for .NET 8 support)
- Windows (cross-platform UI using Eto.Forms)

Build the plugin:

```bash
dotnet build -c Release
```

The build output will be `WebViewPrep.rhp` in `bin/Release/net8.0/`.

### Install to Rhino

#### Option 1: Drag and Drop
Drag `WebViewPrep.rhp` onto the Rhino window to install it for the current session.

#### Option 2: Manual Copy
Copy `WebViewPrep.rhp` to one of these locations:
- Per-user: `%APPDATA%\McNeel\Rhinoceros\packages\8.0\WebViewPrep\`
- All users: `%PROGRAMDATA%\McNeel\Rhinoceros\8.0\Plug-ins\`

Restart Rhino after copying.

#### Option 3: Yak Package Manager

Package the plugin:

```bash
yak build
```

Install locally:

```bash
yak install webviewprep-1.0.0-rh8-any.yak
```

Or publish to the package server:

```bash
yak push webviewprep-1.0.0-rh8-any.yak
```

After installation, restart Rhino. The WebView Prep panel will be available in the Panels menu.

## Features

- **Multiple Export Formats**: STL (default), GLB (with materials), or 3DM (full fidelity)
- **Metadata Preservation**: Layers, materials, and dimensions are extracted and displayed
- **Rhino-Style Navigation**: Right-drag to orbit, Shift+Right-drag to pan, wheel to zoom
- **Z-Up Orientation**: Models display in Rhino's coordinate system, not rotated
- **Localhost Preview**: Built-in HTTP server for instant browser preview
- **Standalone Export**: Export as a single HTML file with embedded model data

## Usage

### Opening the Panel

1. In Rhino, open the Panels menu
2. Select "WebView Prep"
3. The panel will dock in your workspace

### Generating a Preview

1. Open or create a Rhino model with visible geometry
2. In the WebView Prep panel, select your export format:
   - **STL**: Lightweight, best for basic geometry (default)
   - **GLB**: Includes materials and textures
   - **3DM**: Full Rhino model with layers, materials, and dimensions
3. Check the options you want to include:
   - Include Materials
   - Include Layers
   - Include Dimensions
4. Click "Generate Web Page for Model"

The plugin will:
- Export the model to the chosen format
- Generate an HTML page with a three.js viewer
- Start a local web server
- Display the preview URL (typically `http://localhost:8080/`)

### Viewing the Preview

After generation, three buttons appear:

- **Open Preview in Browser**: Opens the preview in your default web browser
- **Export as HTML**: Saves a standalone HTML file with the model embedded as base64 data
- **Cancel**: Stops the local server and returns to the initial state

### Navigation in the Web Viewer

The web viewer uses Rhino-style navigation:

- **Right-drag**: Rotate (orbit) around the model
- **Shift+Right-drag**: Pan the view
- **Mouse wheel**: Zoom toward the cursor
- **Reset View button**: Returns to the initial camera position
- **Toggle Info button**: Show/hide the metadata panel

## Technical Details

### Browser Compatibility

The generated HTML uses modern web standards:
- ES modules for three.js (requires a recent browser)
- Import maps for dependency management
- Tested in Chrome, Edge, Firefox, and Safari

### Export Process

1. **Model Export**: Uses Rhino's built-in export functions
   - STL: Binary format with computed normals
   - GLB: Exports materials and textures
   - 3DM: Native Rhino format for full fidelity

2. **Metadata Extraction**:
   - Layers: Name, color, and visibility
   - Materials: Diffuse color, transparency, reflectivity, shine
   - Dimensions: Annotation text and type
   - Bounding box: Used for camera setup and zoom limits

3. **HTML Generation**:
   - Three.js viewer with appropriate loader (STL, GLTF, or 3DM)
   - Z-up camera configuration (`camera.up.set(0, 0, 1)`)
   - Rhino-style OrbitControls (right-button orbit)
   - Custom delta-proportional wheel zoom
   - Metadata info panel

### Localhost Server

The preview server uses `HttpListener` to serve files:
- Automatically finds an available port (8080-8179)
- Serves the HTML and model files
- Runs on a background thread
- Stops cleanly when Cancel is clicked or the panel is closed

### Standalone Export

The Export as HTML feature creates a single-file preview:
- Reads the model file (STL, GLB, or 3DM)
- Encodes it as base64 data URI
- Embeds it directly in the HTML
- The resulting file can be shared or hosted anywhere

## Troubleshooting

### Plugin Doesn't Load

1. Check Rhino version: Rhino 8.20+ is required for .NET 8 plugins
2. Run `_PlugInManager` in Rhino and look for "WebView Prep"
3. If listed but not loaded, check the error message
4. Try launching Rhino with `/netcore` explicitly

### Export Fails

- Ensure there are visible objects in the model
- Check that the selected format is supported
- Large models may take time to export - watch the Rhino command line

### Preview Doesn't Open

- Check that the local server started (watch the status label)
- Try manually navigating to the URL shown
- Check Windows Firewall settings for localhost access

### Model Shows Sideways

This should not happen - the viewer is configured for Z-up. If it does:
- Check that three.js is loading from the CDN (requires internet)
- Check the browser console for errors

## Development

### Debugging

The project includes a launch profile for debugging with Rhino:

1. Open the project in Visual Studio or Rider
2. Set breakpoints in the code
3. Press F5 to launch Rhino with the plugin loaded
4. The plugin loads from the build output directory

If the plugin locks the DLL and prevents rebuilding:
- Close Rhino before rebuilding
- Or use the build script pattern that renames locked files

### Project Structure

```
WebViewPrep/
├── Properties/
│   ├── AssemblyInfo.cs          # Plugin GUID and metadata
│   └── launchSettings.json      # Debug launch profiles
├── WebViewPrepPlugIn.cs         # Main plugin class
├── WebViewPrepPanel.cs          # Eto.Forms panel UI
├── WebPageGenerator.cs          # Export and HTML generation
├── PreviewServer.cs             # Localhost HTTP server
├── HtmlExporter.cs              # Standalone HTML export
├── ExportOptions.cs             # Export configuration
├── WebViewPrep.csproj           # Project file
├── manifest.yml                 # Yak package manifest
└── README.md                    # This file
```

### Key Dependencies

- `RhinoCommon` (8.x) - Rhino API
- `System.Net.HttpListener` - Built-in HTTP server
- `Eto.Forms` - Cross-platform UI (included in RhinoCommon)

### Important Notes

- The plugin GUID in AssemblyInfo.cs must never change after release
- The panel GUID attribute must be unique and stable
- RhinoCommon is excluded from output (`ExcludeAssets="runtime"`)
- `EnableDynamicLoading=true` ensures third-party dependencies load correctly

## License

This is example code for demonstration purposes. Adjust the license as needed for your use case.

## Credits

- Uses [three.js](https://threejs.org/) for 3D rendering
- Built with [RhinoCommon](https://developer.rhino3d.com/) SDK
- UI framework: [Eto.Forms](https://github.com/picoe/Eto)
