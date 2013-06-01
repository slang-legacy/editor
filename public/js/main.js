(function() {
  require.config({
    paths: {
      jquery: 'jquery',
      ace: "/../components/ace/lib/ace"
    }
  });

  require(['jquery', 'ace/editor'], function($) {
    return $(function() {
      var ace, d, editor, stream;

      stream = shoe("http://localhost:3000/dnode");
      d = dnode();
      d.on("remote", function(remote) {
        remote.readdirSync("/home/slang", function(files) {
          return document.getElementById('result').textContent = files.join('\n');
        });
        return remote.readFileSync("/home/slang/.bashrc", function(files) {
          return document.getElementById('editor').textContent = files;
        });
      });
      d.pipe(stream).pipe(d);
      ace = require("ace/editor");
      editor = ace.edit("editor");
      editor.setTheme("ace/theme/monokai");
      return editor.getSession().setMode("ace/mode/javascript");
    });
  });

}).call(this);
