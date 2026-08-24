namespace WebViewPrep
{
    /// <summary>
    /// Options for exporting the model and generating the web page
    /// </summary>
    public class ExportOptions
    {
        /// <summary>
        /// Export format: "stl", "glb", or "3dm"
        /// </summary>
        public string Format { get; set; } = "stl";

        /// <summary>
        /// Include material information in the web page
        /// </summary>
        public bool IncludeMaterials { get; set; } = true;

        /// <summary>
        /// Include layer information in the web page
        /// </summary>
        public bool IncludeLayers { get; set; } = true;

        /// <summary>
        /// Include dimension annotations in the web page
        /// </summary>
        public bool IncludeDimensions { get; set; } = true;
    }
}
