using System;
using System.IO;
using System.Net;
using System.Threading;
using Rhino;

namespace WebViewPrep
{
    /// <summary>
    /// Localhost HTTP server for previewing generated web pages
    /// </summary>
    public class PreviewServer
    {
        private readonly string _rootPath;
        private readonly int _port;
        private HttpListener? _listener;
        private Thread? _listenerThread;
        private volatile bool _running;

        public string Url => $"http://localhost:{_port}/";

        public PreviewServer(string htmlPath, int port = 0)
        {
            _rootPath = Path.GetDirectoryName(htmlPath) ?? throw new ArgumentException("Invalid path", nameof(htmlPath));
            _port = port == 0 ? FindAvailablePort() : port;
        }

        public void Start()
        {
            if (_running) return;

            try
            {
                _listener = new HttpListener();
                _listener.Prefixes.Add(Url);
                _listener.Start();
                _running = true;

                _listenerThread = new Thread(ListenerLoop)
                {
                    IsBackground = true,
                    Name = "WebView Preview Server"
                };
                _listenerThread.Start();

                RhinoApp.WriteLine($"Preview server started at {Url}");
            }
            catch (Exception ex)
            {
                RhinoApp.WriteLine($"Failed to start preview server: {ex.Message}");
                throw;
            }
        }

        public void Stop()
        {
            if (!_running) return;

            _running = false;
            _listener?.Stop();
            _listener?.Close();
            _listenerThread?.Join(1000);

            RhinoApp.WriteLine("Preview server stopped");
        }

        private void ListenerLoop()
        {
            while (_running && _listener != null)
            {
                try
                {
                    var context = _listener.GetContext();
                    ThreadPool.QueueUserWorkItem(_ => HandleRequest(context));
                }
                catch (HttpListenerException)
                {
                    // Expected when stopping
                    if (_running)
                    {
                        RhinoApp.WriteLine("Preview server encountered an error");
                    }
                    break;
                }
                catch (Exception ex)
                {
                    RhinoApp.WriteLine($"Preview server error: {ex.Message}");
                }
            }
        }

        private void HandleRequest(HttpListenerContext context)
        {
            try
            {
                var request = context.Request;
                var response = context.Response;

                // Get requested path
                string requestPath = request.Url?.AbsolutePath.TrimStart('/') ?? "";
                if (string.IsNullOrEmpty(requestPath))
                {
                    requestPath = "index.html";
                }

                string filePath = Path.Combine(_rootPath, requestPath);

                // Security check - ensure the path is within the root
                string fullPath = Path.GetFullPath(filePath);
                string fullRoot = Path.GetFullPath(_rootPath);
                if (!fullPath.StartsWith(fullRoot, StringComparison.OrdinalIgnoreCase))
                {
                    response.StatusCode = 403;
                    response.Close();
                    return;
                }

                if (!File.Exists(filePath))
                {
                    response.StatusCode = 404;
                    byte[] buffer = System.Text.Encoding.UTF8.GetBytes("File not found");
                    response.ContentLength64 = buffer.Length;
                    response.OutputStream.Write(buffer, 0, buffer.Length);
                    response.Close();
                    return;
                }

                // Set content type based on extension
                string contentType = GetContentType(Path.GetExtension(filePath));
                response.ContentType = contentType;

                // Send file
                byte[] fileData = File.ReadAllBytes(filePath);
                response.ContentLength64 = fileData.Length;
                response.OutputStream.Write(fileData, 0, fileData.Length);
                response.Close();
            }
            catch (Exception ex)
            {
                RhinoApp.WriteLine($"Error handling request: {ex.Message}");
                try
                {
                    context.Response.StatusCode = 500;
                    context.Response.Close();
                }
                catch { }
            }
        }

        private static string GetContentType(string extension)
        {
            return extension.ToLowerInvariant() switch
            {
                ".html" or ".htm" => "text/html",
                ".css" => "text/css",
                ".js" => "application/javascript",
                ".json" => "application/json",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                ".svg" => "image/svg+xml",
                ".stl" => "model/stl",
                ".glb" => "model/gltf-binary",
                ".gltf" => "model/gltf+json",
                ".3dm" => "application/x-rhinoceros",
                _ => "application/octet-stream"
            };
        }

        private static int FindAvailablePort()
        {
            // Start from 8080 and find the first available port
            for (int port = 8080; port < 8180; port++)
            {
                try
                {
                    var listener = new HttpListener();
                    listener.Prefixes.Add($"http://localhost:{port}/");
                    listener.Start();
                    listener.Stop();
                    return port;
                }
                catch
                {
                    // Port in use, try next
                }
            }
            return 8080; // Fallback
        }
    }
}
