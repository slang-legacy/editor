
# requirejs makes life a lot easier when dealing with more than one
# javascript file and any sort of dependencies, and loads faster.

# for more info on require config, see http://requirejs.org/docs/api.html#config
require.config
	paths:
		jquery: 'jquery'
		ace: "/../components/ace/lib/ace"

require ['jquery', 'ace/editor'], ($) ->
	$ ->
		stream = shoe("http://localhost:3000/dnode")

		d = dnode()
		d.on "remote", (remote) ->
			remote.readdirSync "/home/slang", (files) ->
				document.getElementById('result').textContent = files.join('\n')
			remote.readFileSync "/home/slang/.bashrc", (files) ->
				document.getElementById('editor').textContent = files

		d.pipe(stream).pipe d

		ace = require("ace/editor")
		editor = ace.edit("editor")
		editor.setTheme("ace/theme/monokai");
		editor.getSession().setMode("ace/mode/javascript");
