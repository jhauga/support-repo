using System;
using System.Runtime.InteropServices;
using Eto.Drawing;
using Eto.Forms;
using Rhino;
using Rhino.UI;

namespace WebViewPrep
{
    /// <summary>
    /// Panel that provides web preview generation controls
    /// </summary>
    [Guid("7F4C9A1E-8D2B-4E7A-B3F5-6C8D2E9A1F4B")]
    public class WebViewPrepPanel : Panel
    {
        private readonly uint _documentSerialNumber;
        private Button _generateButton = null!;
        private Button _openBrowserButton = null!;
        private Button _exportHtmlButton = null!;
        private Button _cancelButton = null!;
        private Label _statusLabel = null!;
        private DropDown _formatDropDown = null!;
        private CheckBox _includeMaterialsCheckBox = null!;
        private CheckBox _includeLayersCheckBox = null!;
        private CheckBox _includeDimensionsCheckBox = null!;
        private StackLayout _initialLayout = null!;
        private StackLayout _previewLayout = null!;
        
        private PreviewServer? _previewServer;
        private string? _generatedHtmlPath;

        /// <summary>
        /// Panel constructor - Rhino calls this with the document serial number
        /// </summary>
        public WebViewPrepPanel(uint documentSerialNumber)
        {
            _documentSerialNumber = documentSerialNumber;
            InitializeComponents();
        }

        private void InitializeComponents()
        {
            // Status label (shared across layouts)
            _statusLabel = new Label
            {
                Text = "Ready to generate web preview",
                Wrap = WrapMode.Word
            };

            // Export format dropdown
            _formatDropDown = new DropDown();
            _formatDropDown.Items.Add("STL (Standard)");
            _formatDropDown.Items.Add("GLB (with materials)");
            _formatDropDown.Items.Add("3DM (full fidelity)");
            _formatDropDown.SelectedIndex = 0;

            // Feature checkboxes
            _includeMaterialsCheckBox = new CheckBox { Text = "Include Materials", Checked = true };
            _includeLayersCheckBox = new CheckBox { Text = "Include Layers", Checked = true };
            _includeDimensionsCheckBox = new CheckBox { Text = "Include Dimensions", Checked = true };

            // Initial layout - before generation
            _generateButton = new Button { Text = "Generate Web Page for Model" };
            _generateButton.Click += OnGenerateClicked;

            _initialLayout = new StackLayout
            {
                Padding = 10,
                Spacing = 10,
                Items =
                {
                    new Label { Text = "Export Format:", Font = SystemFonts.Bold() },
                    _formatDropDown,
                    new Label { Text = "Options:", Font = SystemFonts.Bold() },
                    _includeMaterialsCheckBox,
                    _includeLayersCheckBox,
                    _includeDimensionsCheckBox,
                    _generateButton,
                    _statusLabel
                }
            };

            // Preview layout - after generation
            _openBrowserButton = new Button { Text = "Open Preview in Browser" };
            _openBrowserButton.Click += OnOpenBrowserClicked;

            _exportHtmlButton = new Button { Text = "Export as HTML" };
            _exportHtmlButton.Click += OnExportHtmlClicked;

            _cancelButton = new Button { Text = "Cancel" };
            _cancelButton.Click += OnCancelClicked;

            _previewLayout = new StackLayout
            {
                Padding = 10,
                Spacing = 10,
                Items =
                {
                    _openBrowserButton,
                    _exportHtmlButton,
                    _cancelButton,
                    _statusLabel
                }
            };
            _previewLayout.Visible = false;

            // Main content - stack both layouts
            Content = new StackLayout
            {
                Items =
                {
                    _initialLayout,
                    _previewLayout
                }
            };
        }

        private void OnGenerateClicked(object? sender, EventArgs e)
        {
            try
            {
                _statusLabel.Text = "Generating web preview...";
                _generateButton.Enabled = false;

                var doc = RhinoDoc.FromRuntimeSerialNumber(_documentSerialNumber);
                if (doc == null)
                {
                    _statusLabel.Text = "Error: Document not found";
                    _generateButton.Enabled = true;
                    return;
                }

                // Determine export format
                string format = _formatDropDown.SelectedIndex switch
                {
                    0 => "stl",
                    1 => "glb",
                    2 => "3dm",
                    _ => "stl"
                };

                // Create export options
                var options = new ExportOptions
                {
                    Format = format,
                    IncludeMaterials = _includeMaterialsCheckBox.Checked ?? false,
                    IncludeLayers = _includeLayersCheckBox.Checked ?? false,
                    IncludeDimensions = _includeDimensionsCheckBox.Checked ?? false
                };

                // Export and generate HTML
                var generator = new WebPageGenerator(doc);
                _generatedHtmlPath = generator.GeneratePreview(options);

                if (_generatedHtmlPath == null)
                {
                    _statusLabel.Text = "Error: Failed to generate preview";
                    _generateButton.Enabled = true;
                    return;
                }

                // Start localhost server
                _previewServer = new PreviewServer(_generatedHtmlPath);
                _previewServer.Start();

                // Switch to preview layout
                _initialLayout.Visible = false;
                _previewLayout.Visible = true;
                _statusLabel.Text = $"Preview ready at {_previewServer.Url}";
            }
            catch (Exception ex)
            {
                _statusLabel.Text = $"Error: {ex.Message}";
                _generateButton.Enabled = true;
                RhinoApp.WriteLine($"WebView Prep Error: {ex}");
            }
        }

        private void OnOpenBrowserClicked(object? sender, EventArgs e)
        {
            if (_previewServer != null)
            {
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                {
                    FileName = _previewServer.Url,
                    UseShellExecute = true
                });
                _statusLabel.Text = "Browser opened";
            }
        }

        private void OnExportHtmlClicked(object? sender, EventArgs e)
        {
            try
            {
                var dialog = new Eto.Forms.SaveFileDialog
                {
                    Title = "Export HTML Preview",
                    Filters =
                    {
                        new FileFilter("HTML Files", ".html")
                    }
                };

                if (dialog.ShowDialog(this) == DialogResult.Ok && _generatedHtmlPath != null)
                {
                    var exporter = new HtmlExporter(_generatedHtmlPath);
                    exporter.ExportStandalone(dialog.FileName);
                    _statusLabel.Text = $"Exported to {dialog.FileName}";
                }
            }
            catch (Exception ex)
            {
                _statusLabel.Text = $"Export error: {ex.Message}";
                RhinoApp.WriteLine($"WebView Prep Export Error: {ex}");
            }
        }

        private void OnCancelClicked(object? sender, EventArgs e)
        {
            // Stop the server and reset to initial state
            _previewServer?.Stop();
            _previewServer = null;
            _generatedHtmlPath = null;

            _previewLayout.Visible = false;
            _initialLayout.Visible = true;
            _generateButton.Enabled = true;
            _statusLabel.Text = "Ready to generate web preview";
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                _previewServer?.Stop();
            }
            base.Dispose(disposing);
        }
    }
}
