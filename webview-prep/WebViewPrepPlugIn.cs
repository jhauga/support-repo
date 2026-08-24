using System;
using Rhino;
using Rhino.PlugIns;
using Rhino.UI;

namespace WebViewPrep
{
    /// <summary>
    /// WebView Prep plugin - generates interactive web previews of Rhino models
    /// </summary>
    public class WebViewPrepPlugIn : PlugIn
    {
        public WebViewPrepPlugIn()
        {
            if (Instance == null)
                Instance = this;
        }

        /// <summary>
        /// Gets the only instance of the WebViewPrepPlugIn plugin.
        /// </summary>
        public static WebViewPrepPlugIn? Instance { get; private set; }

        /// <summary>
        /// Load at startup so the panel is available immediately
        /// </summary>
        protected override LoadReturnCode OnLoad(ref string errorMessage)
        {
            try
            {
                // Register the panel
                Panels.RegisterPanel(this, typeof(WebViewPrepPanel), "WebView Prep", null);
                return LoadReturnCode.Success;
            }
            catch (Exception ex)
            {
                errorMessage = $"Failed to load WebView Prep plugin: {ex.Message}";
                RhinoApp.WriteLine($"WebView Prep Error: {ex}");
                return LoadReturnCode.ErrorShowDialog;
            }
        }

        /// <summary>
        /// Load this plugin at Rhino startup
        /// </summary>
        public override PlugInLoadTime LoadTime => PlugInLoadTime.AtStartup;
    }
}
