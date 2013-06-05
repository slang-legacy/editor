(function() {
  require.config({
    paths: {
      jquery: 'jquery',
      ace: '/components/ace/build/src/'
    }
  });

  require(['jquery', 'ace/mode-javascript', "ace/theme-monokai"], function($) {
    return $(function() {
      var EditSession, Editor, Renderer, ace_container, editor, mode_javascript, session, stream, temp;

      stream = shoe("http://localhost:3000/dnode");
      temp = "	$ ->\nstream = shoe(\"http://localhost:3000/dnode\")\n\nd = dnode()\nd.on \"remote\", (remote) ->\n	remote.readdirSync \"/home/slang\", (files) ->\n		document.getElementById('result').textContent = files.join('\n')\n	remote.readFileSync \"/home/slang/.bashrc\", (files) ->\n		document.getElementById('editor').textContent = files\n\nd.pipe(stream).pipe d";
      EditSession = require('ace/edit_session').EditSession;
      Editor = require("ace/editor").Editor;
      Renderer = require("ace/virtual_renderer").VirtualRenderer;
      mode_javascript = require('ace/mode-javascript');
      session = new EditSession(temp, mode_javascript);
      ace_container = new Renderer(document.getElementById('editor'), require("ace/theme-monokai"));
      return editor = new Editor(ace_container, session);
    });
  });

}).call(this);
