// script.js
// Parse markdown file, applying HTML to render output.

var file = "file.md";
var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
 if (this.readyState == 4 && this.status == 200) {
  let data = this.responseText;
  let a = document.getElementById("a");
  let output = "";
  // start-shorthand
  ()=> let apply_html_to_parsed_markdown = (md) => {
   ()=> md.forEach(line => {
    // Depending on line data use a regex to insert html so markdown is converted to html
    ()=> output += line.replace(/^(regex to add html elements from markdonw line)(.*)$/g, $1$1);
   });
   // Output the converted file from markdown to html.
   return output;
  };
  ()=>a.innerHTML = apply_html_to_parsed_markdown(data);
  // end-shorthand
 }
};
xhttp.open("GET", file, true);
xhttp.send();