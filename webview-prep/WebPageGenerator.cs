using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using Rhino;
using Rhino.DocObjects;
using Rhino.FileIO;
using Rhino.Geometry;

namespace WebViewPrep
{
    /// <summary>
    /// Generates web preview pages for Rhino models
    /// </summary>
    public class WebPageGenerator
    {
        private readonly RhinoDoc _doc;
        private readonly string _tempDir;

        public WebPageGenerator(RhinoDoc doc)
        {
            _doc = doc;
            _tempDir = Path.Combine(Path.GetTempPath(), $"rhino_webview_{Guid.NewGuid():N}");
            Directory.CreateDirectory(_tempDir);
        }

        /// <summary>
        /// Generate the complete web preview
        /// </summary>
        public string? GeneratePreview(ExportOptions options)
        {
            try
            {
                // Export the model
                string modelFileName = $"model.{options.Format}";
                string modelPath = Path.Combine(_tempDir, modelFileName);
                
                if (!ExportModel(modelPath, options.Format))
                {
                    RhinoApp.WriteLine("Failed to export model");
                    return null;
                }

                // Collect metadata
                var metadata = CollectMetadata(options);

                // Generate HTML
                string htmlPath = Path.Combine(_tempDir, "index.html");
                GenerateHtml(htmlPath, modelFileName, options.Format, metadata);

                return htmlPath;
            }
            catch (Exception ex)
            {
                RhinoApp.WriteLine($"Error generating preview: {ex}");
                return null;
            }
        }

        private bool ExportModel(string path, string format)
        {
            try
            {
                // Get all visible objects
                var visibleObjects = _doc.Objects
                    .Where(obj => obj.Visible && obj.IsValid)
                    .ToList();

                if (visibleObjects.Count == 0)
                {
                    RhinoApp.WriteLine("No visible objects to export");
                    return false;
                }

                if (format.ToLower() == "3dm")
                {
                    // For 3dm, save a copy of the document
                    return _doc.WriteFile(path, new FileWriteOptions());
                }

                // For STL and GLB, use direct export APIs or commands
                // Save current selection state
                var selectedObjects = _doc.Objects
                    .Where(obj => obj.IsSelected(false) > 0)
                    .Select(obj => obj.Id)
                    .ToList();

                try
                {
                    // Deselect all
                    _doc.Objects.UnselectAll();

                    // Select all visible objects
                    foreach (var obj in visibleObjects)
                    {
                        obj.Select(true);
                    }

                    _doc.Views.Redraw();

                    // Export based on format
                    bool success = false;
                    string formatLower = format.ToLower();

                    if (formatLower == "stl")
                    {
                        // Export to STL
                        var script = $"_-Export \"{path}\" _Binary=Yes _ExportParameterSpaceCurves=No _Enter";
                        success = RhinoApp.RunScript(script, false);
                    }
                    else if (formatLower == "glb")
                    {
                        // Export to GLB (GLTF binary)
                        var script = $"_-Export \"{path}\" _ExportMaterials=Yes _ExportTextures=Yes _UseDracoCompression=No _Enter";
                        success = RhinoApp.RunScript(script, false);
                    }

                    // Wait a moment for file to be written
                    System.Threading.Thread.Sleep(500);

                    return File.Exists(path) && new FileInfo(path).Length > 0;
                }
                finally
                {
                    // Restore selection state
                    _doc.Objects.UnselectAll();
                    foreach (var id in selectedObjects)
                    {
                        var obj = _doc.Objects.FindId(id);
                        obj?.Select(true);
                    }
                    _doc.Views.Redraw();
                }
            }
            catch (Exception ex)
            {
                RhinoApp.WriteLine($"Error exporting model: {ex}");
                return false;
            }
        }

        private ModelMetadata CollectMetadata(ExportOptions options)
        {
            var metadata = new ModelMetadata();

            if (options.IncludeLayers)
            {
                metadata.Layers = _doc.Layers
                    .Where(layer => !layer.IsDeleted && layer.IsVisible)
                    .Select(layer => new LayerInfo
                    {
                        Name = layer.Name,
                        Color = $"#{layer.Color.R:X2}{layer.Color.G:X2}{layer.Color.B:X2}",
                        Index = layer.Index
                    })
                    .ToList();
            }

            if (options.IncludeMaterials)
            {
                var materialIndices = new HashSet<int>();
                
                // Collect materials from visible objects
                foreach (var obj in _doc.Objects.Where(o => o.Visible && o.IsValid))
                {
                    var material = obj.GetMaterial(true);
                    if (material != null && material.Index >= 0)
                    {
                        materialIndices.Add(material.Index);
                    }
                }

                metadata.Materials = materialIndices
                    .Select(index => _doc.Materials.FindIndex(index))
                    .Where(mat => mat != null)
                    .Select(mat => new MaterialInfo
                    {
                        Name = mat!.Name,
                        DiffuseColor = $"#{mat.DiffuseColor.R:X2}{mat.DiffuseColor.G:X2}{mat.DiffuseColor.B:X2}",
                        Transparency = mat.Transparency,
                        Reflectivity = mat.Reflectivity,
                        Shine = mat.Shine
                    })
                    .ToList();
            }

            if (options.IncludeDimensions)
            {
                metadata.Dimensions = _doc.Objects
                    .Where(obj => obj.Visible && 
                                  obj.ObjectType == ObjectType.Annotation &&
                                  obj.Geometry is AnnotationBase)
                    .Select(obj => new DimensionInfo
                    {
                        Text = (obj.Geometry as AnnotationBase)?.PlainText ?? "",
                        Type = obj.Geometry.GetType().Name
                    })
                    .ToList();
            }

            // Calculate bounding box for camera setup
            var bbox = _doc.Objects
                .Where(obj => obj.Visible && obj.IsValid)
                .Select(obj => obj.Geometry?.GetBoundingBox(true))
                .Where(bb => bb.HasValue && bb.Value.IsValid)
                .Aggregate(BoundingBox.Empty, (acc, bb) => 
                {
                    acc.Union(bb!.Value);
                    return acc;
                });

            if (bbox.IsValid)
            {
                metadata.BoundingBox = new BoundingBoxInfo
                {
                    MinX = bbox.Min.X,
                    MinY = bbox.Min.Y,
                    MinZ = bbox.Min.Z,
                    MaxX = bbox.Max.X,
                    MaxY = bbox.Max.Y,
                    MaxZ = bbox.Max.Z
                };
            }

            return metadata;
        }

        private void GenerateHtml(string path, string modelFileName, string format, ModelMetadata metadata)
        {
            var html = new StringBuilder();
            
            html.AppendLine("<!DOCTYPE html>");
            html.AppendLine("<html lang=\"en\">");
            html.AppendLine("<head>");
            html.AppendLine("  <meta charset=\"UTF-8\">");
            html.AppendLine("  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
            html.AppendLine("  <title>Rhino Model Preview</title>");
            html.AppendLine("  <style>");
            html.AppendLine("    body { margin: 0; overflow: hidden; font-family: Arial, sans-serif; }");
            html.AppendLine("    #container { position: relative; width: 100vw; height: 100vh; }");
            html.AppendLine("    #viewer { width: 100%; height: 100%; }");
            html.AppendLine("    #info { position: absolute; top: 10px; left: 10px; color: white; ");
            html.AppendLine("            background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px; ");
            html.AppendLine("            max-width: 300px; max-height: 80vh; overflow-y: auto; }");
            html.AppendLine("    #controls { position: absolute; bottom: 10px; right: 10px; color: white; ");
            html.AppendLine("                background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px; }");
            html.AppendLine("    #loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); ");
            html.AppendLine("               color: white; font-size: 24px; background: rgba(0,0,0,0.8); ");
            html.AppendLine("               padding: 20px; border-radius: 10px; }");
            html.AppendLine("    #error { display: none; position: absolute; top: 50%; left: 50%; ");
            html.AppendLine("             transform: translate(-50%, -50%); color: white; font-size: 18px; ");
            html.AppendLine("             background: rgba(200,0,0,0.9); padding: 20px; border-radius: 10px; }");
            html.AppendLine("    button { margin: 5px; padding: 8px 15px; cursor: pointer; }");
            html.AppendLine("    .section { margin-bottom: 15px; }");
            html.AppendLine("    .section-title { font-weight: bold; margin-bottom: 5px; }");
            html.AppendLine("    .item { margin-left: 10px; font-size: 12px; }");
            html.AppendLine("  </style>");
            html.AppendLine("</head>");
            html.AppendLine("<body>");
            html.AppendLine("  <div id=\"container\">");
            html.AppendLine("    <div id=\"viewer\"></div>");
            html.AppendLine("    <div id=\"loading\">Loading model...</div>");
            html.AppendLine("    <div id=\"error\">Failed to load model. Check the browser console for details.</div>");
            html.AppendLine("    <div id=\"info\" style=\"display: none;\">");
            
            // Add metadata to info panel
            bool hasMetadata = false;
            
            if (metadata.Layers.Count > 0)
            {
                hasMetadata = true;
                html.AppendLine("      <div class=\"section\">");
                html.AppendLine("        <div class=\"section-title\">Layers</div>");
                foreach (var layer in metadata.Layers)
                {
                    html.AppendLine($"        <div class=\"item\" style=\"color: {layer.Color};\">{layer.Name}</div>");
                }
                html.AppendLine("      </div>");
            }

            if (metadata.Materials.Count > 0)
            {
                hasMetadata = true;
                html.AppendLine("      <div class=\"section\">");
                html.AppendLine("        <div class=\"section-title\">Materials</div>");
                foreach (var mat in metadata.Materials)
                {
                    html.AppendLine($"        <div class=\"item\">{mat.Name}</div>");
                }
                html.AppendLine("      </div>");
            }

            if (metadata.Dimensions.Count > 0)
            {
                hasMetadata = true;
                html.AppendLine("      <div class=\"section\">");
                html.AppendLine("        <div class=\"section-title\">Dimensions</div>");
                foreach (var dim in metadata.Dimensions)
                {
                    html.AppendLine($"        <div class=\"item\">{dim.Text} ({dim.Type})</div>");
                }
                html.AppendLine("      </div>");
            }

            // Add fallback message if no metadata
            if (!hasMetadata)
            {
                html.AppendLine("      <div class=\"section\">");
                html.AppendLine("        <div class=\"section-title\">Model Info</div>");
                html.AppendLine("        <div class=\"item\">No layer, material, or dimension data available</div>");
                html.AppendLine("      </div>");
            }

            html.AppendLine("    </div>");
            html.AppendLine("    <div id=\"controls\">");
            html.AppendLine("      <div style=\"margin-bottom: 10px;\">Navigation:</div>");
            html.AppendLine("      <div style=\"font-size: 12px;\">Right-drag: Rotate</div>");
            html.AppendLine("      <div style=\"font-size: 12px;\">Shift+Right-drag: Pan</div>");
            html.AppendLine("      <div style=\"font-size: 12px;\">Wheel: Zoom</div>");
            html.AppendLine("      <button id=\"resetView\">Reset View</button>");
            html.AppendLine("      <button id=\"toggleInfo\">Toggle Info</button>");
            html.AppendLine("    </div>");
            html.AppendLine("  </div>");
            html.AppendLine("");
            html.AppendLine("  <script type=\"importmap\">");
            html.AppendLine("  {");
            html.AppendLine("    \"imports\": {");
            html.AppendLine("      \"three\": \"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js\",");
            html.AppendLine("      \"three/addons/\": \"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/\"");
            html.AppendLine("    }");
            html.AppendLine("  }");
            html.AppendLine("  </script>");
            html.AppendLine("");
            html.AppendLine("  <script type=\"module\">");
            html.AppendLine("    import * as THREE from 'three';");
            html.AppendLine("    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';");
            
            // Add appropriate loader based on format
            string loaderImport = format.ToLower() switch
            {
                "glb" => "import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';",
                "3dm" => "import { Rhino3dmLoader } from 'three/addons/loaders/3DMLoader.js';",
                _ => "import { STLLoader } from 'three/addons/loaders/STLLoader.js';"
            };
            html.AppendLine($"    {loaderImport}");
            html.AppendLine("");
            html.AppendLine("    let camera, scene, renderer, controls, model;");
            html.AppendLine("    let initialCameraPos, initialTarget;");
            html.AppendLine("    let infoVisible = false;  // Track info panel state");
            html.AppendLine("");
            
            // Add bounding box data
            if (metadata.BoundingBox != null)
            {
                var bb = metadata.BoundingBox;
                html.AppendLine($"    const bbox = {{");
                html.AppendLine($"      min: new THREE.Vector3({bb.MinX}, {bb.MinY}, {bb.MinZ}),");
                html.AppendLine($"      max: new THREE.Vector3({bb.MaxX}, {bb.MaxY}, {bb.MaxZ})");
                html.AppendLine($"    }};");
                html.AppendLine($"    const center = new THREE.Vector3(");
                html.AppendLine($"      ({bb.MinX} + {bb.MaxX}) / 2,");
                html.AppendLine($"      ({bb.MinY} + {bb.MaxY}) / 2,");
                html.AppendLine($"      ({bb.MinZ} + {bb.MaxZ}) / 2");
                html.AppendLine($"    );");
                var size = Math.Max(Math.Max(bb.MaxX - bb.MinX, bb.MaxY - bb.MinY), bb.MaxZ - bb.MinZ);
                html.AppendLine($"    const maxDim = {size};");
            }
            else
            {
                html.AppendLine("    const center = new THREE.Vector3(0, 0, 0);");
                html.AppendLine("    const maxDim = 10;");
            }
            
            html.AppendLine("");
            html.AppendLine("    try {");
            html.AppendLine("      init();");
            html.AppendLine("      loadModel();");
            html.AppendLine("    } catch (err) {");
            html.AppendLine("      showError(err);");
            html.AppendLine("    }");
            html.AppendLine("");
            html.AppendLine("    function init() {");
            html.AppendLine("      const container = document.getElementById('viewer');");
            html.AppendLine("");
            html.AppendLine("      // Scene");
            html.AppendLine("      scene = new THREE.Scene();");
            html.AppendLine("      scene.background = new THREE.Color(0x404040);");
            html.AppendLine("");
            html.AppendLine("      // Camera - Z-up for Rhino compatibility");
            html.AppendLine("      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, maxDim * 100);");
            html.AppendLine("      camera.up.set(0, 0, 1);  // Z-up before controls!");
            html.AppendLine("      camera.position.set(center.x + maxDim * 2, center.y - maxDim * 2, center.z + maxDim);");
            html.AppendLine("      camera.lookAt(center);");
            html.AppendLine("");
            html.AppendLine("      // Renderer");
            html.AppendLine("      renderer = new THREE.WebGLRenderer({ antialias: true });");
            html.AppendLine("      renderer.setSize(window.innerWidth, window.innerHeight);");
            html.AppendLine("      renderer.setPixelRatio(window.devicePixelRatio);");
            html.AppendLine("      container.appendChild(renderer.domElement);");
            html.AppendLine("");
            html.AppendLine("      // Lights");
            html.AppendLine("      const ambientLight = new THREE.AmbientLight(0x404040, 2);");
            html.AppendLine("      scene.add(ambientLight);");
            html.AppendLine("      const directionalLight = new THREE.DirectionalLight(0xffffff, 2);");
            html.AppendLine("      directionalLight.position.set(1, 1, 1);");
            html.AppendLine("      scene.add(directionalLight);");
            html.AppendLine("");
            html.AppendLine("      // OrbitControls - Rhino-style navigation");
            html.AppendLine("      controls = new OrbitControls(camera, renderer.domElement);");
            html.AppendLine("      controls.target.copy(center);");
            html.AppendLine("      controls.mouseButtons = {");
            html.AppendLine("        LEFT: null,              // No left-drag (reserved for selection in Rhino)");
            html.AppendLine("        MIDDLE: THREE.MOUSE.PAN,");
            html.AppendLine("        RIGHT: THREE.MOUSE.ROTATE  // Right-drag orbits (Rhino convention)");
            html.AppendLine("      };");
            html.AppendLine("      controls.enableZoom = false;  // Custom wheel zoom below");
            html.AppendLine("      controls.zoomToCursor = true;");
            html.AppendLine("      controls.enableDamping = true;");
            html.AppendLine("      controls.dampingFactor = 0.05;");
            html.AppendLine("");
            html.AppendLine("      // Custom wheel zoom - delta-proportional, not fixed-step");
            html.AppendLine("      renderer.domElement.addEventListener('wheel', (e) => {");
            html.AppendLine("        e.preventDefault();");
            html.AppendLine("        const dist = camera.position.distanceTo(controls.target);");
            html.AppendLine("        const newDist = dist * Math.exp(e.deltaY * 0.0005);");
            html.AppendLine("        const clampedDist = Math.max(maxDim * 0.05, Math.min(maxDim * 10, newDist));");
            html.AppendLine("        const direction = new THREE.Vector3()");
            html.AppendLine("          .subVectors(camera.position, controls.target)");
            html.AppendLine("          .normalize();");
            html.AppendLine("        camera.position.copy(controls.target).addScaledVector(direction, clampedDist);");
            html.AppendLine("        controls.update();");
            html.AppendLine("      }, { passive: false });");
            html.AppendLine("");
            html.AppendLine("      // Grid - rotate to XY plane (Rhino ground)");
            html.AppendLine("      const gridHelper = new THREE.GridHelper(maxDim * 2, 20);");
            html.AppendLine("      gridHelper.rotation.x = Math.PI / 2;");
            html.AppendLine("      scene.add(gridHelper);");
            html.AppendLine("");
            html.AppendLine("      // Save initial view");
            html.AppendLine("      initialCameraPos = camera.position.clone();");
            html.AppendLine("      initialTarget = controls.target.clone();");
            html.AppendLine("");
            html.AppendLine("      // Event listeners");
            html.AppendLine("      window.addEventListener('resize', onWindowResize);");
            html.AppendLine("      document.getElementById('resetView').addEventListener('click', resetView);");
            html.AppendLine("      document.getElementById('toggleInfo').addEventListener('click', () => {");
            html.AppendLine("        const info = document.getElementById('info');");
            html.AppendLine("        infoVisible = !infoVisible;");
            html.AppendLine("        info.style.display = infoVisible ? 'block' : 'none';");
            html.AppendLine("      });");
            html.AppendLine("");
            html.AppendLine("      // Start animation");
            html.AppendLine("      animate();");
            html.AppendLine("    }");
            html.AppendLine("");
            html.AppendLine("    function loadModel() {");
            
            // Add loader based on format
            string loaderCode = format.ToLower() switch
            {
                "glb" => @"      const loader = new GLTFLoader();
      loader.load(
        '" + modelFileName + @"',
        (gltf) => {
          model = gltf.scene;
          scene.add(model);
          document.getElementById('loading').style.display = 'none';
          document.getElementById('info').style.display = 'block';
          infoVisible = true;
        },
        undefined,
        (error) => showError(error)
      );",
                "3dm" => @"      const loader = new Rhino3dmLoader();
      loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@8.0.1/');
      loader.load(
        '" + modelFileName + @"',
        (object) => {
          model = object;
          scene.add(model);
          document.getElementById('loading').style.display = 'none';
          document.getElementById('info').style.display = 'block';
          infoVisible = true;
        },
        undefined,
        (error) => showError(error)
      );",
                _ => @"      const loader = new STLLoader();
      loader.load(
        '" + modelFileName + @"',
        (geometry) => {
          const material = new THREE.MeshPhongMaterial({ color: 0xaaaaaa, specular: 0x111111, shininess: 30 });
          model = new THREE.Mesh(geometry, material);
          scene.add(model);
          document.getElementById('loading').style.display = 'none';
          document.getElementById('info').style.display = 'block';
          infoVisible = true;
        },
        undefined,
        (error) => showError(error)
      );"
            };
            
            html.AppendLine(loaderCode);
            html.AppendLine("    }");
            html.AppendLine("");
            html.AppendLine("    function animate() {");
            html.AppendLine("      requestAnimationFrame(animate);");
            html.AppendLine("      controls.update();");
            html.AppendLine("      renderer.render(scene, camera);");
            html.AppendLine("    }");
            html.AppendLine("");
            html.AppendLine("    function onWindowResize() {");
            html.AppendLine("      camera.aspect = window.innerWidth / window.innerHeight;");
            html.AppendLine("      camera.updateProjectionMatrix();");
            html.AppendLine("      renderer.setSize(window.innerWidth, window.innerHeight);");
            html.AppendLine("    }");
            html.AppendLine("");
            html.AppendLine("    function resetView() {");
            html.AppendLine("      camera.position.copy(initialCameraPos);");
            html.AppendLine("      controls.target.copy(initialTarget);");
            html.AppendLine("      controls.update();");
            html.AppendLine("    }");
            html.AppendLine("");
            html.AppendLine("    function showError(error) {");
            html.AppendLine("      console.error('Error loading model:', error);");
            html.AppendLine("      document.getElementById('loading').style.display = 'none';");
            html.AppendLine("      document.getElementById('error').style.display = 'block';");
            html.AppendLine("      document.getElementById('error').textContent = 'Error: ' + error.message;");
            html.AppendLine("    }");
            html.AppendLine("  </script>");
            html.AppendLine("</body>");
            html.AppendLine("</html>");

            File.WriteAllText(path, html.ToString());
        }
    }

    // Supporting classes for metadata
    internal class ModelMetadata
    {
        public List<LayerInfo> Layers { get; set; } = new();
        public List<MaterialInfo> Materials { get; set; } = new();
        public List<DimensionInfo> Dimensions { get; set; } = new();
        public BoundingBoxInfo? BoundingBox { get; set; }
    }

    internal class LayerInfo
    {
        public string Name { get; set; } = "";
        public string Color { get; set; } = "";
        public int Index { get; set; }
    }

    internal class MaterialInfo
    {
        public string Name { get; set; } = "";
        public string DiffuseColor { get; set; } = "";
        public double Transparency { get; set; }
        public double Reflectivity { get; set; }
        public double Shine { get; set; }
    }

    internal class DimensionInfo
    {
        public string Text { get; set; } = "";
        public string Type { get; set; } = "";
    }

    internal class BoundingBoxInfo
    {
        public double MinX { get; set; }
        public double MinY { get; set; }
        public double MinZ { get; set; }
        public double MaxX { get; set; }
        public double MaxY { get; set; }
        public double MaxZ { get; set; }
    }
}
