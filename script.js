// script.js
// Parse markdown file, applying HTML to render output.

var file = "file.md";
var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
 if (this.readyState == 4 && this.status == 200) {
  let data = this.responseText;
  let a = document.getElementById("a");
  let output = "";
  
  // Function to convert markdown to HTML
  let apply_html_to_parsed_markdown = (md) => {
   let lines = md.split('\n');
   
   lines.forEach(line => {
    // Convert markdown headers (# Header)
    if (line.match(/^#{1,6}\s/)) {
     let level = line.match(/^#+/)[0].length;
     let text = line.replace(/^#+\s/, '');
     output += `<h${level}>${text}</h${level}>`;
    }
    // Convert bold text (**text** or __text__)
    else if (line.match(/\*\*.*\*\*|__.*__/)) {
     line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
     line = line.replace(/__(.*?)__/g, '<strong>$1</strong>');
     output += `<p>${line}</p>`;
    }
    // Convert italic text (*text* or _text_)
    else if (line.match(/\*.*\*|_.*_/)) {
     line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
     line = line.replace(/_(.*?)_/g, '<em>$1</em>');
     output += `<p>${line}</p>`;
    }
    // Convert unordered lists (- item or * item)
    else if (line.match(/^[\*\-]\s/)) {
     let text = line.replace(/^[\*\-]\s/, '');
     output += `<ul><li>${text}</li></ul>`;
    }
    // Convert ordered lists (1. item)
    else if (line.match(/^\d+\.\s/)) {
     let text = line.replace(/^\d+\.\s/, '');
     output += `<ol><li>${text}</li></ol>`;
    }
    // Convert links ([text](url))
    else if (line.match(/\[.*?\]\(.*?\)/)) {
     line = line.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
     output += `<p>${line}</p>`;
    }
    // Convert code blocks (```code```)
    else if (line.match(/```/)) {
     output += line.includes('```') ? '<pre><code>' : '</code></pre>';
    }
    // Convert inline code (`code`)
    else if (line.match(/`.*?`/)) {
     line = line.replace(/`(.*?)`/g, '<code>$1</code>');
     output += `<p>${line}</p>`;
    }
    // Convert blockquotes (> text)
    else if (line.match(/^>\s/)) {
     let text = line.replace(/^>\s/, '');
     output += `<blockquote>${text}</blockquote>`;
    }
    // Empty line becomes line break
    else if (line.trim() === '') {
     output += '<br>';
    }
    // Regular paragraph
    else if (line.trim() !== '') {
     output += `<p>${line}</p>`;
    }
   });
   
   return output;
  };
  
  // Apply the markdown to HTML conversion and render to element with id="a"
  a.innerHTML = apply_html_to_parsed_markdown(data);
 }
};
xhttp.open("GET", file, true);
xhttp.send();