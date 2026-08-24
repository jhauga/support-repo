using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;

namespace WebViewPrep
{
    /// <summary>
    /// Exports a web preview as a standalone HTML file with embedded resources
    /// </summary>
    public class HtmlExporter
    {
        private readonly string _sourcePath;

        public HtmlExporter(string sourcePath)
        {
            _sourcePath = sourcePath;
        }

        /// <summary>
        /// Export the preview as a standalone HTML file with embedded model
        /// </summary>
        public void ExportStandalone(string outputPath)
        {
            try
            {
                // Read the source HTML
                string html = File.ReadAllText(_sourcePath);
                string sourceDir = Path.GetDirectoryName(_sourcePath) ?? "";

                // Find and embed the model file
                html = EmbedModelFile(html, sourceDir);

                // Write the standalone HTML
                File.WriteAllText(outputPath, html, Encoding.UTF8);
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to export standalone HTML: {ex.Message}", ex);
            }
        }

        private static string EmbedModelFile(string html, string sourceDir)
        {
            // Find model references in the loader code
            // Pattern: loader.load('model.ext', ...)
            var pattern = @"loader\.load\s*\(\s*['""]([^'""]+\.(stl|glb|3dm))['""]";
            var match = Regex.Match(html, pattern, RegexOptions.IgnoreCase);

            if (!match.Success)
            {
                return html; // No model file found, return as-is
            }

            string modelFileName = match.Groups[1].Value;
            string modelPath = Path.Combine(sourceDir, modelFileName);

            if (!File.Exists(modelPath))
            {
                throw new FileNotFoundException($"Model file not found: {modelPath}");
            }

            // Read and encode the model file
            byte[] modelData = File.ReadAllBytes(modelPath);
            string base64Data = Convert.ToBase64String(modelData);
            string extension = Path.GetExtension(modelFileName).TrimStart('.').ToLowerInvariant();
            
            string mimeType = extension switch
            {
                "stl" => "model/stl",
                "glb" => "model/gltf-binary",
                "3dm" => "application/x-rhinoceros",
                _ => "application/octet-stream"
            };

            string dataUri = $"data:{mimeType};base64,{base64Data}";

            // Replace the model reference with the data URI
            html = Regex.Replace(
                html,
                pattern,
                $"loader.load('{dataUri}'",
                RegexOptions.IgnoreCase
            );

            return html;
        }
    }
}
