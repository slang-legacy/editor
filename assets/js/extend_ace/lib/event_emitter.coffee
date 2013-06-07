define [], () ->
	stopPropagation = ->
		@propagationStopped = true

	preventDefault = ->
		@defaultPrevented = true

	class EventEmitter
		constructor: ->
			@_dispatchEvent = @_emit
			@addEventListener = @on 
			@removeListener = @removeEventListener = @off

		_emit: (eventName, e) ->
			@_eventRegistry or (@_eventRegistry = {})
			@_defaultHandlers or (@_defaultHandlers = {})
			listeners = @_eventRegistry[eventName] or []
			defaultHandler = @_defaultHandlers[eventName]
			return  if not listeners.length and not defaultHandler
			e = {}  if typeof e isnt "object" or not e
			e.type = eventName  unless e.type
			e.stopPropagation = stopPropagation  unless e.stopPropagation
			e.preventDefault = preventDefault  unless e.preventDefault
			i = 0

			while i < listeners.length
				listeners[i] e, this
				break  if e.propagationStopped
				i++
			defaultHandler e, this  if defaultHandler and not e.defaultPrevented

		_signal: (eventName, e) ->
			listeners = (@_eventRegistry or {})[eventName]
			return  unless listeners
			i = 0

			while i < listeners.length
				listeners[i] e, this
				i++

		once: (eventName, callback) ->
			_self = this
			callback and @addEventListener(eventName, newCallback = ->
				_self.removeEventListener eventName, newCallback
				callback.apply null, arguments_
			)

		setDefaultHandler: (eventName, callback) ->
			handlers = @_defaultHandlers
			handlers = @_defaultHandlers = _disabled_: {}  unless handlers
			if handlers[eventName]
				old = handlers[eventName]
				disabled = handlers._disabled_[eventName]
				handlers._disabled_[eventName] = disabled = []  unless disabled
				disabled.push old
				i = disabled.indexOf(callback)
				disabled.splice i, 1  unless i is -1
			handlers[eventName] = callback

		removeDefaultHandler: (eventName, callback) ->
			handlers = @_defaultHandlers
			return  unless handlers
			disabled = handlers._disabled_[eventName]
			if handlers[eventName] is callback
				old = handlers[eventName]
				@setDefaultHandler eventName, disabled.pop()  if disabled
			else if disabled
				i = disabled.indexOf(callback)
				disabled.splice i, 1  unless i is -1

		on: (eventName, callback, capturing) ->
			@_eventRegistry = @_eventRegistry or {}
			listeners = @_eventRegistry[eventName]
			listeners = @_eventRegistry[eventName] = []  unless listeners
			listeners[(if capturing then "unshift" else "push")] callback  if listeners.indexOf(callback) is -1
			callback

		off: (eventName, callback) ->
			@_eventRegistry = @_eventRegistry or {}
			listeners = @_eventRegistry[eventName]
			return  unless listeners
			index = listeners.indexOf(callback)
			listeners.splice index, 1  if index isnt -1

		removeAllListeners: (eventName) ->
			@_eventRegistry[eventName] = []  if @_eventRegistry

	return EventEmitter
