(function() {
  require.config({
    paths: {
      jquery: 'jquery',
      ace: '/components/ace/lib/ace'
    }
  });

  require(['jquery', 'ace/editor', 'ace/edit_session', "ace/undomanager", 'ace/virtual_renderer', "ace/multi_select", 'ace/mode/coffee', "ace/theme/monokai"], function($) {
    return $(function() {
      var EditSession, Editor, MultiSelect, Renderer, UndoManager, ace_container, editor, mode, session, temp;

      temp = "$ ->\n	stream = shoe(\"http://localhost:3000/dnode\")\n\n	d = dnode()\n	d.on \"remote\", (remote) ->\n		remote.readdirSync \"/home/slang\", (files) ->\n			document.getElementById('result').textContent = files.join('\n')\n		remote.readFileSync \"/home/slang/.bashrc\", (files) ->\n			document.getElementById('editor').textContent = files\n\n	d.pipe(stream).pipe d";
      EditSession = require('ace/edit_session').EditSession;
      Editor = require("ace/editor").Editor;
      MultiSelect = require("ace/multi_select").MultiSelect;
      UndoManager = require("ace/undomanager").UndoManager;
      Renderer = require("ace/virtual_renderer").VirtualRenderer;
      mode = require('ace/mode/coffee');
      session = new EditSession(temp, "ace/mode/coffee");
      session.setUndoManager(new UndoManager());
      ace_container = new Renderer(document.getElementById('editor'), require("ace/theme/monokai"));
      editor = new Editor(ace_container, session);
      new MultiSelect(editor);
      return console.log(session.modeName);
    });
  });

}).call(this);
