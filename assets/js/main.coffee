require.config
	paths:
		jquery: 'jquery'
		ace: '/components/ace/build/src/'

require [
	'jquery'
	'ace/mode-javascript'
	"ace/theme-monokai"
], ($) ->
	$ ->
		stream = shoe("http://localhost:3000/dnode")
		temp = """	$ ->
		stream = shoe("http://localhost:3000/dnode")

		d = dnode()
		d.on "remote", (remote) ->
			remote.readdirSync "/home/slang", (files) ->
				document.getElementById('result').textContent = files.join('\n')
			remote.readFileSync "/home/slang/.bashrc", (files) ->
				document.getElementById('editor').textContent = files

		d.pipe(stream).pipe d"""

		#d = dnode()
		#d.on "remote", (remote) ->
		#	remote.readdirSync "/home/slang", (files) ->
		#		#document.getElementById('result').textContent = files.join('\n')
		#	remote.readFileSync "/home/slang/.bashrc", (file) ->
		#		temp = file

		#d.pipe(stream).pipe d

		EditSession = require('ace/edit_session').EditSession
		Editor = require("ace/editor").Editor
		Renderer = require("ace/virtual_renderer").VirtualRenderer
		mode_javascript = require('ace/mode-javascript')

		session = new EditSession(temp, mode_javascript)
		ace_container = new Renderer(
			document.getElementById('editor'),
			require("ace/theme-monokai")
		)
		editor = new Editor(ace_container, session)
