require.config
	paths:
		jquery: 'jquery'
		ace: '/components/ace/lib/ace'

require [
	'jquery'
	'ace/editor'
	'ace/edit_session'
	"ace/undomanager"
	'ace/virtual_renderer'
	"ace/multi_select"
	'ace/mode/coffee'
	"ace/theme/monokai"
], ($) ->
	$ ->
		temp = """
		$ ->
			stream = shoe("http://localhost:3000/dnode")

			d = dnode()
			d.on "remote", (remote) ->
				remote.readdirSync "/home/slang", (files) ->
					document.getElementById('result').textContent = files.join('\n')
				remote.readFileSync "/home/slang/.bashrc", (files) ->
					document.getElementById('editor').textContent = files

			d.pipe(stream).pipe d
		"""

		#stream = shoe("http://localhost:3000/dnode")
		#d = dnode()
		#d.on "remote", (remote) ->
		#	remote.readdirSync "/home/slang", (files) ->
		#		#document.getElementById('result').textContent = files.join('\n')
		#	remote.readFileSync "/home/slang/.bashrc", (file) ->
		#		temp = file

		#d.pipe(stream).pipe d

		EditSession = require('ace/edit_session').EditSession
		Editor = require("ace/editor").Editor
		MultiSelect = require("ace/multi_select").MultiSelect
		UndoManager = require("ace/undomanager").UndoManager
		Renderer = require("ace/virtual_renderer").VirtualRenderer
		mode = require('ace/mode/coffee')

		session = new EditSession(temp,"ace/mode/coffee")
		session.setUndoManager(new UndoManager())
		#session.setMode("ace/mode/coffee")
		ace_container = new Renderer(
			document.getElementById('editor'),
			require("ace/theme/monokai")
		)
		editor = new Editor(ace_container, session)
		new MultiSelect(editor)

		console.log session.modeName
