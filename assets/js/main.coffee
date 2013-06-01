
# requirejs makes life a lot easier when dealing with more than one
# javascript file and any sort of dependencies, and loads faster.

# for more info on require config, see http://requirejs.org/docs/api.html#config
require.config
	paths:
		jquery: 'jquery'

require ['jquery'], ($) ->
	$ ->
		stream = shoe("http://localhost:3000/dnode")
		result = document.getElementById('result');

		d = dnode()
		d.on "remote", (remote) ->
			remote.transform "beep", (s) ->
				result.textContent = "beep => " + s


		d.pipe(stream).pipe d
