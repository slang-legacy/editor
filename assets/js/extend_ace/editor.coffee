define [
	"ace/lib/fixoldbrowsers"
	"ace/lib/oop"
	"ace/lib/dom"
	"ace/lib/lang"
	"ace/lib/useragent"
	"ace/keyboard/textinput"
	"ace/mouse/mouse_handler"
	"ace/mouse/fold_handler"
	"ace/keyboard/keybinding"
	"ace/edit_session"
	"ace/search"
	"ace/range"
	"extend_ace/lib/event_emitter"
	"ace/commands/command_manager"
	"ace/commands/default_commands"
	"ace/config"
], () ->
	require "ace/lib/fixoldbrowsers"
	oop = require("ace/lib/oop")
	dom = require("ace/lib/dom")
	lang = require("ace/lib/lang")
	useragent = require("ace/lib/useragent")
	TextInput = require("ace/keyboard/textinput").TextInput
	MouseHandler = require("ace/mouse/mouse_handler").MouseHandler
	FoldHandler = require("ace/mouse/fold_handler").FoldHandler
	KeyBinding = require("ace/keyboard/keybinding").KeyBinding
	EditSession = require("ace/edit_session").EditSession
	Search = require("ace/search").Search
	Range = require("ace/range").Range
	EventEmitter = require("extend_ace/lib/event_emitter")
	CommandManager = require("ace/commands/command_manager").CommandManager
	defaultCommands = require("ace/commands/default_commands").commands
	config = require("ace/config")

	console.log EventEmitter
	###
	The main entry point into the Ace functionality.
	
	The `Editor` manages the [[EditSession]] (which manages [[Document]]s), as well as the [[VirtualRenderer]], which draws everything to the screen.
	
	Event sessions dealing with the mouse and keyboard are bubbled up from `Document` to the `Editor`, which decides what to do with them.
	@class Editor
	###
	class Editor extends EventEmitter
		
		###
		Creates a new `Editor` object.
		
		@param {VirtualRenderer} renderer Associated `VirtualRenderer` that draws everything
		@param {EditSession} session The `EditSession` to refer to
		
		@constructor
		###
		constructor: (renderer, session) ->
			container = renderer.getContainerElement()
			@container = container
			@renderer = renderer
			@commands = new CommandManager((if useragent.isMac then "mac" else "win"), defaultCommands)
			@textInput = new TextInput(renderer.getTextAreaContainer(), this)
			@renderer.textarea = @textInput.getElement()
			@keyBinding = new KeyBinding(this)
			
			# TODO detect touch event support
			@$mouseHandler = new MouseHandler(this)
			new FoldHandler(this)
			@$blockScrolling = 0
			@$search = new Search().set(wrap: true)
			@setSession session or new EditSession("")
			config.resetOptions this
			config._emit "editor", this

		###
		Sets a new key handler, such as "vim" or "windows".
		@param {String} keyboardHandler The new key handler
		###
		setKeyboardHandler: (keyboardHandler) ->
			unless keyboardHandler
				@keyBinding.setKeyboardHandler null
			else if typeof keyboardHandler is "string"
				@$keybindingId = keyboardHandler
				_self = this
				config.loadModule ["keybinding", keyboardHandler], (module) ->
					_self.keyBinding.setKeyboardHandler module and module.handler  if _self.$keybindingId is keyboardHandler

			else
				delete @$keybindingId

				@keyBinding.setKeyboardHandler keyboardHandler

		###
		Returns the keyboard handler, such as "vim" or "windows".
		
		@returns {String}
		###
		getKeyboardHandler: ->
			@keyBinding.getKeyboardHandler()

		###
		Emitted whenever the [[EditSession]] changes.
		@event changeSession
		@param {Object} e An object with two properties, `oldSession` and `session`, that represent the old and new [[EditSession]]s.
		###
		###
		Sets a new editsession to use. This method also emits the `'changeSession'` event.
		@param {EditSession} session The new session to use
		###
		setSession: (session) ->
			return  if @session is session
			if @session
				oldSession = @session
				@session.removeEventListener "change", @$onDocumentChange
				@session.removeEventListener "changeMode", @$onChangeMode
				@session.removeEventListener "tokenizerUpdate", @$onTokenizerUpdate
				@session.removeEventListener "changeTabSize", @$onChangeTabSize
				@session.removeEventListener "changeWrapLimit", @$onChangeWrapLimit
				@session.removeEventListener "changeWrapMode", @$onChangeWrapMode
				@session.removeEventListener "onChangeFold", @$onChangeFold
				@session.removeEventListener "changeFrontMarker", @$onChangeFrontMarker
				@session.removeEventListener "changeBackMarker", @$onChangeBackMarker
				@session.removeEventListener "changeBreakpoint", @$onChangeBreakpoint
				@session.removeEventListener "changeAnnotation", @$onChangeAnnotation
				@session.removeEventListener "changeOverwrite", @$onCursorChange
				@session.removeEventListener "changeScrollTop", @$onScrollTopChange
				@session.removeEventListener "changeScrollLeft", @$onScrollLeftChange
				selection = @session.getSelection()
				selection.removeEventListener "changeCursor", @$onCursorChange
				selection.removeEventListener "changeSelection", @$onSelectionChange
			@session = session
			@$onDocumentChange = @onDocumentChange.bind(this)
			session.addEventListener "change", @$onDocumentChange
			@renderer.setSession session
			@$onChangeMode = @onChangeMode.bind(this)
			session.addEventListener "changeMode", @$onChangeMode
			@$onTokenizerUpdate = @onTokenizerUpdate.bind(this)
			session.addEventListener "tokenizerUpdate", @$onTokenizerUpdate
			@$onChangeTabSize = @renderer.onChangeTabSize.bind(@renderer)
			session.addEventListener "changeTabSize", @$onChangeTabSize
			@$onChangeWrapLimit = @onChangeWrapLimit.bind(this)
			session.addEventListener "changeWrapLimit", @$onChangeWrapLimit
			@$onChangeWrapMode = @onChangeWrapMode.bind(this)
			session.addEventListener "changeWrapMode", @$onChangeWrapMode
			@$onChangeFold = @onChangeFold.bind(this)
			session.addEventListener "changeFold", @$onChangeFold
			@$onChangeFrontMarker = @onChangeFrontMarker.bind(this)
			@session.addEventListener "changeFrontMarker", @$onChangeFrontMarker
			@$onChangeBackMarker = @onChangeBackMarker.bind(this)
			@session.addEventListener "changeBackMarker", @$onChangeBackMarker
			@$onChangeBreakpoint = @onChangeBreakpoint.bind(this)
			@session.addEventListener "changeBreakpoint", @$onChangeBreakpoint
			@$onChangeAnnotation = @onChangeAnnotation.bind(this)
			@session.addEventListener "changeAnnotation", @$onChangeAnnotation
			@$onCursorChange = @onCursorChange.bind(this)
			@session.addEventListener "changeOverwrite", @$onCursorChange
			@$onScrollTopChange = @onScrollTopChange.bind(this)
			@session.addEventListener "changeScrollTop", @$onScrollTopChange
			@$onScrollLeftChange = @onScrollLeftChange.bind(this)
			@session.addEventListener "changeScrollLeft", @$onScrollLeftChange
			@selection = session.getSelection()
			@selection.addEventListener "changeCursor", @$onCursorChange
			@$onSelectionChange = @onSelectionChange.bind(this)
			@selection.addEventListener "changeSelection", @$onSelectionChange
			@onChangeMode()
			@$blockScrolling += 1
			@onCursorChange()
			@$blockScrolling -= 1
			@onScrollTopChange()
			@onScrollLeftChange()
			@onSelectionChange()
			@onChangeFrontMarker()
			@onChangeBackMarker()
			@onChangeBreakpoint()
			@onChangeAnnotation()
			@session.getUseWrapMode() and @renderer.adjustWrapLimit()
			@renderer.updateFull()
			@_emit "changeSession",
				session: session
				oldSession: oldSession

		###
		Returns the current session being used.
		@returns {EditSession}
		###
		getSession: ->
			@session

		###
		Sets the current document to `val`.
		@param {String} val The new value to set for the document
		@param {Number} cursorPos Where to set the new value. `undefined` or 0 is selectAll, -1 is at the document start, and 1 is at the end
		
		@returns {String} The current document value
		@related Document.setValue
		###
		setValue: (val, cursorPos) ->
			@session.doc.setValue val
			unless cursorPos
				@selectAll()
			else if cursorPos is 1
				@navigateFileEnd()
			else @navigateFileStart()  if cursorPos is -1
			val

		###
		Returns the current session's content.
		
		@returns {String}
		@related EditSession.getValue
		###
		getValue: ->
			@session.getValue()

		###
		Returns the currently highlighted selection.
		@returns {String} The highlighted selection
		###
		getSelection: ->
			@selection

		###
		{:VirtualRenderer.onResize}
		@param {Boolean} force If `true`, recomputes the size, even if the height and width haven't changed
		
		
		@related VirtualRenderer.onResize
		###
		resize: (force) ->
			@renderer.onResize force

		###
		{:VirtualRenderer.setTheme}
		@param {String} theme The path to a theme
		###
		setTheme: (theme) ->
			@renderer.setTheme theme

		###
		{:VirtualRenderer.getTheme}
		
		@returns {String} The set theme
		@related VirtualRenderer.getTheme
		###
		getTheme: ->
			@renderer.getTheme()

		###
		{:VirtualRenderer.setStyle}
		@param {String} style A class name
		
		
		@related VirtualRenderer.setStyle
		###
		setStyle: (style) ->
			@renderer.setStyle style

		###
		{:VirtualRenderer.unsetStyle}
		@related VirtualRenderer.unsetStyle
		###
		unsetStyle: (style) ->
			@renderer.unsetStyle style

		###
		Gets the current font size of the editor text.
		###
		getFontSize: ->
			@getOption("fontSize") or dom.computedStyle(@container, "fontSize")

		###
		Set a new font size (in pixels) for the editor text.
		@param {String} size A font size ( _e.g._ "12px")
		###
		setFontSize: (size) ->
			@setOption "fontSize", size

		$highlightBrackets: ->
			if @session.$bracketHighlight
				@session.removeMarker @session.$bracketHighlight
				@session.$bracketHighlight = null
			return  if @$highlightPending
			# perform highlight async to not block the browser during navigation
			self = this
			@$highlightPending = true
			setTimeout (->
				self.$highlightPending = false
				pos = self.session.findMatchingBracket(self.getCursorPosition())
				if pos
					range = new Range(pos.row, pos.column, pos.row, pos.column + 1)
				else range = self.session.$mode.getMatching(self.session)  if self.session.$mode.getMatching
				self.session.$bracketHighlight = self.session.addMarker(range, "ace_bracket", "text")  if range
			), 50

		###
		Brings the current `textInput` into focus.
		###
		focus: ->
			# Safari needs the timeout
			# iOS and Firefox need it called immediately
			# to be on the save side we do both
			_self = this
			setTimeout ->
				_self.textInput.focus()

			@textInput.focus()

		###
		Returns `true` if the current `textInput` is in focus.
		@return {Boolean}
		###
		isFocused: ->
			@textInput.isFocused()

		###
		Blurs the current `textInput`.
		###
		blur: ->
			@textInput.blur()

		###
		Emitted once the editor comes into focus.
		@event focus
		###
		onFocus: ->
			return  if @$isFocused
			@$isFocused = true
			@renderer.showCursor()
			@renderer.visualizeFocus()
			@_emit "focus"

		###
		Emitted once the editor has been blurred.
		@event blur
		###
		onBlur: ->
			return  unless @$isFocused
			@$isFocused = false
			@renderer.hideCursor()
			@renderer.visualizeBlur()
			@_emit "blur"

		$cursorChange: ->
			@renderer.updateCursor()

	
		###
		Emitted whenever the document is changed.
		@event change
		@param {Object} e Contains a single property, `data`, which has the delta of changes
		###
		onDocumentChange: (e) ->
			delta = e.data
			range = delta.range
			lastRow = undefined
			if range.start.row is range.end.row and delta.action isnt "insertLines" and delta.action isnt "removeLines"
				lastRow = range.end.row
			else
				lastRow = Infinity
			@renderer.updateLines range.start.row, lastRow
			@_emit "change", e
			# update cursor because tab characters can influence the cursor position
			@$cursorChange()

		onTokenizerUpdate: (e) ->
			rows = e.data
			@renderer.updateLines rows.first, rows.last

		onScrollTopChange: ->
			@renderer.scrollToY @session.getScrollTop()

		onScrollLeftChange: ->
			@renderer.scrollToX @session.getScrollLeft()

		###
		Emitted when the selection changes.
		###
		onCursorChange: ->
			@$cursorChange()
			@renderer.scrollCursorIntoView()  unless @$blockScrolling
			@$highlightBrackets()
			@$updateHighlightActiveLine()
			@_emit "changeSelection"

		$updateHighlightActiveLine: ->
			session = @getSession()
			highlight = undefined
			highlight = @getCursorPosition()  if @$selectionStyle isnt "line" or not @selection.isMultiLine()  if @$highlightActiveLine
			if session.$highlightLineMarker and not highlight
				session.removeMarker session.$highlightLineMarker.id
				session.$highlightLineMarker = null
			else if not session.$highlightLineMarker and highlight
				range = new Range(highlight.row, highlight.column, highlight.row, Infinity)
				range.id = session.addMarker(range, "ace_active-line", "screenLine")
				session.$highlightLineMarker = range
			else if highlight
				session.$highlightLineMarker.start.row = highlight.row
				session.$highlightLineMarker.end.row = highlight.row
				session.$highlightLineMarker.start.column = highlight.column
				session._emit "changeBackMarker"

		onSelectionChange: (e) ->
			session = @session
			session.removeMarker session.$selectionMarker  if session.$selectionMarker
			session.$selectionMarker = null
			unless @selection.isEmpty()
				range = @selection.getRange()
				style = @getSelectionStyle()
				session.$selectionMarker = session.addMarker(range, "ace_selection", style)
			else
				@$updateHighlightActiveLine()
			re = @$highlightSelectedWord and @$getSelectionHighLightRegexp()
			@session.highlight re
			@_emit "changeSelection"

	
		$getSelectionHighLightRegexp: ->
			session = @session
			selection = @getSelectionRange()
			return  if selection.isEmpty() or selection.isMultiLine()
			startOuter = selection.start.column - 1
			endOuter = selection.end.column + 1
			line = session.getLine(selection.start.row)
			lineCols = line.length
			needle = line.substring(Math.max(startOuter, 0), Math.min(endOuter, lineCols))
			# Make sure the outer characters are not part of the word.
			return  if (startOuter >= 0 and /^[\w\d]/.test(needle)) or (endOuter <= lineCols and /[\w\d]$/.test(needle))
			needle = line.substring(selection.start.column, selection.end.column)
			return  unless /^[\w\d]+$/.test(needle)
			re = @$search.$assembleRegExp(
				wholeWord: true
				caseSensitive: true
				needle: needle
			)
			re

		onChangeFrontMarker: ->
			@renderer.updateFrontMarkers()

		onChangeBackMarker: ->
			@renderer.updateBackMarkers()

		onChangeBreakpoint: ->
			@renderer.updateBreakpoints()

		onChangeAnnotation: ->
			@renderer.setAnnotations @session.getAnnotations()

		onChangeMode: (e) ->
			@renderer.updateText()
			@_emit "changeMode", e

		onChangeWrapLimit: ->
			@renderer.updateFull()

		onChangeWrapMode: ->
			@renderer.onResize true

		onChangeFold: ->
			# Update the active line marker as due to folding changes the current
			# line range on the screen might have changed.
			@$updateHighlightActiveLine()
			# TODO: This might be too much updating. Okay for now.
			@renderer.updateFull()

		###
		Emitted when text is copied.
		@event copy
		@param {String} text The copied text
		###
		###
		Returns the string of text currently highlighted.
		@returns {String}
		###
		getCopyText: ->
			text = ""
			text = @session.getTextRange(@getSelectionRange())  unless @selection.isEmpty()
			@_emit "copy", text
			text

		###
		Called whenever a text "copy" happens.
		###
		onCopy: ->
			@commands.exec "copy", this

		###
		Called whenever a text "cut" happens.
		###
		onCut: ->
			@commands.exec "cut", this

		###
		Emitted when text is pasted.
		@event paste
		@param {String} text The pasted text
		###
		###
		Called whenever a text "paste" happens.
		@param {String} text The pasted text
		###
		onPaste: (text) ->
			# todo this should change when paste becomes a command
			return  if @$readOnly
			@_emit "paste", text
			@insert text

		execCommand: (command, args) ->
			@commands.exec command, this, args

		###
		Inserts `text` into wherever the cursor is pointing.
		@param {String} text The new text to add
		###
		insert: (text) ->
			session = @session
			mode = session.getMode()
			cursor = @getCursorPosition()
			if @getBehavioursEnabled()
				# Get a transform if the current mode wants one.
				transform = mode.transformAction(session.getState(cursor.row), "insertion", this, session, text)
				text = transform.text  if transform
			text = text.replace("\t", @session.getTabString())
			unless @selection.isEmpty()
				# remove selected text
				cursor = @session.remove(@getSelectionRange())
				@clearSelection()
			else if @session.getOverwrite()
				range = new Range.fromPoints(cursor, cursor)
				range.end.column += text.length
				@session.remove range
			@clearSelection()
			start = cursor.column
			lineState = session.getState(cursor.row)
			line = session.getLine(cursor.row)
			shouldOutdent = mode.checkOutdent(lineState, line, text)
			end = session.insert(cursor, text)
			if transform and transform.selection
				if transform.selection.length is 2
					# Transform relative to the current column
					@selection.setSelectionRange new Range(cursor.row, start + transform.selection[0], cursor.row, start + transform.selection[1])
				else
					# Transform relative to the current row.
					@selection.setSelectionRange new Range(cursor.row + transform.selection[0], transform.selection[1], cursor.row + transform.selection[2], transform.selection[3])
			# TODO disabled multiline auto indent
			# possibly doing the indent before inserting the text
			# if (cursor.row !== end.row) {
			if session.getDocument().isNewLine(text)
				lineIndent = mode.getNextLineIndent(lineState, line.slice(0, cursor.column), session.getTabString())
				@moveCursorTo cursor.row + 1, 0
				size = session.getTabSize()
				minIndent = Number.MAX_VALUE
				row = cursor.row + 1

				while row <= end.row
					indent = 0
					line = session.getLine(row)
					i = 0

					while i < line.length
						if line.charAt(i) is "\t"
							indent += size
						else if line.charAt(i) is " "
							indent += 1
						else
							break
						++i
					minIndent = Math.min(indent, minIndent)  if /[^\s]/.test(line)
					++row
				row = cursor.row + 1

				while row <= end.row
					outdent = minIndent
					line = session.getLine(row)
					i = 0

					while i < line.length and outdent > 0
						if line.charAt(i) is "\t"
							outdent -= size
						else outdent -= 1  if line.charAt(i) is " "
						++i
					session.remove new Range(row, 0, row, i)
					++row
				session.indentRows cursor.row + 1, end.row, lineIndent
			mode.autoOutdent lineState, session, cursor.row  if shouldOutdent

		onTextInput: (text) ->
			@keyBinding.onTextInput text

		onCommandKey: (e, hashId, keyCode) ->
			@keyBinding.onCommandKey e, hashId, keyCode

		###
		Pass in `true` to enable overwrites in your session, or `false` to disable. If overwrites is enabled, any text you enter will type over any text after it. If the value of `overwrite` changes, this function also emites the `changeOverwrite` event.
		@param {Boolean} overwrite Defines wheter or not to set overwrites
		
		
		@related EditSession.setOverwrite
		###
		setOverwrite: (overwrite) ->
			@session.setOverwrite overwrite

		###
		Returns `true` if overwrites are enabled; `false` otherwise.
		@returns {Boolean}
		@related EditSession.getOverwrite
		###
		getOverwrite: ->
			@session.getOverwrite()

		###
		Sets the value of overwrite to the opposite of whatever it currently is.
		@related EditSession.toggleOverwrite
		###
		toggleOverwrite: ->
			@session.toggleOverwrite()

		###
		Sets how fast the mouse scrolling should do.
		@param {Number} speed A value indicating the new speed (in milliseconds)
		###
		setScrollSpeed: (speed) ->
			@setOption "scrollSpeed", speed

		###
		Returns the value indicating how fast the mouse scroll speed is (in milliseconds).
		@returns {Number}
		###
		getScrollSpeed: ->
			@getOption "scrollSpeed"

		###
		Sets the delay (in milliseconds) of the mouse drag.
		@param {Number} dragDelay A value indicating the new delay
		###
		setDragDelay: (dragDelay) ->
			@setOption "dragDelay", dragDelay

		###
		Returns the current mouse drag delay.
		@returns {Number}
		###
		getDragDelay: ->
			@getOption "dragDelay"

		###
		Emitted when the selection style changes, via [[Editor.setSelectionStyle]].
		@event changeSelectionStyle
		@param {Object} data Contains one property, `data`, which indicates the new selection style
		###
		###
		Draw selection markers spanning whole line, or only over selected text. Default value is "line"
		@param {String} style The new selection style "line"|"text"
		###
		setSelectionStyle: (val) ->
			@setOption "selectionStyle", val

		###
		Returns the current selection style.
		@returns {String}
		###
		getSelectionStyle: ->
			@getOption "selectionStyle"

		###
		Determines whether or not the current line should be highlighted.
		@param {Boolean} shouldHighlight Set to `true` to highlight the current line
		###
		setHighlightActiveLine: (shouldHighlight) ->
			@setOption "highlightActiveLine", shouldHighlight

		###
		Returns `true` if current lines are always highlighted.
		@return {Boolean}
		###
		getHighlightActiveLine: ->
			@getOption "highlightActiveLine"

		setHighlightGutterLine: (shouldHighlight) ->
			@setOption "highlightGutterLine", shouldHighlight

		getHighlightGutterLine: ->
			@getOption "highlightGutterLine"

		###
		Determines if the currently selected word should be highlighted.
		@param {Boolean} shouldHighlight Set to `true` to highlight the currently selected word
		###
		setHighlightSelectedWord: (shouldHighlight) ->
			@setOption "highlightSelectedWord", shouldHighlight

		###
		Returns `true` if currently highlighted words are to be highlighted.
		@returns {Boolean}
		###
		getHighlightSelectedWord: ->
			@$highlightSelectedWord

		setAnimatedScroll: (shouldAnimate) ->
			@renderer.setAnimatedScroll shouldAnimate

		getAnimatedScroll: ->
			@renderer.getAnimatedScroll()

		###
		If `showInvisibles` is set to `true`, invisible characters&mdash;like spaces or new lines&mdash;are show in the editor.
		@param {Boolean} showInvisibles Specifies whether or not to show invisible characters
		###
		setShowInvisibles: (showInvisibles) ->
			@renderer.setShowInvisibles showInvisibles

		###
		Returns `true` if invisible characters are being shown.
		@returns {Boolean}
		###
		getShowInvisibles: ->
			@renderer.getShowInvisibles()

		setDisplayIndentGuides: (display) ->
			@renderer.setDisplayIndentGuides display

		getDisplayIndentGuides: ->
			@renderer.getDisplayIndentGuides()
	
		###
		If `showPrintMargin` is set to `true`, the print margin is shown in the editor.
		@param {Boolean} showPrintMargin Specifies whether or not to show the print margin
		###
		setShowPrintMargin: (showPrintMargin) ->
			@renderer.setShowPrintMargin showPrintMargin

		###
		Returns `true` if the print margin is being shown.
		@returns {Boolean}
		###
		getShowPrintMargin: ->
			@renderer.getShowPrintMargin()

		###
		Sets the column defining where the print margin should be.
		@param {Number} showPrintMargin Specifies the new print margin
		###
		setPrintMarginColumn: (showPrintMargin) ->
			@renderer.setPrintMarginColumn showPrintMargin

		###
		Returns the column number of where the print margin is.
		@returns {Number}
		###
		getPrintMarginColumn: ->
			@renderer.getPrintMarginColumn()

		###
		If `readOnly` is true, then the editor is set to read-only mode, and none of the content can change.
		@param {Boolean} readOnly Specifies whether the editor can be modified or not
		###
		setReadOnly: (readOnly) ->
			@setOption "readOnly", readOnly

		###
		Returns `true` if the editor is set to read-only mode.
		@returns {Boolean}
		###
		getReadOnly: ->
			@getOption "readOnly"

		###
		Specifies whether to use behaviors or not. ["Behaviors" in this case is the auto-pairing of special characters, like quotation marks, parenthesis, or brackets.]{: #BehaviorsDef}
		@param {Boolean} enabled Enables or disables behaviors
		###
		setBehavioursEnabled: (enabled) ->
			@setOption "behavioursEnabled", enabled

		###
		Returns `true` if the behaviors are currently enabled. {:BehaviorsDef}
		
		@returns {Boolean}
		###
		getBehavioursEnabled: ->
			@getOption "behavioursEnabled"

		###
		Specifies whether to use wrapping behaviors or not, i.e. automatically wrapping the selection with characters such as brackets
		when such a character is typed in.
		@param {Boolean} enabled Enables or disables wrapping behaviors
		###
		setWrapBehavioursEnabled: (enabled) ->
			@setOption "wrapBehavioursEnabled", enabled

		###
		Returns `true` if the wrapping behaviors are currently enabled.
		###
		getWrapBehavioursEnabled: ->
			@getOption "wrapBehavioursEnabled"

		###
		Indicates whether the fold widgets should be shown or not.
		@param {Boolean} show Specifies whether the fold widgets are shown
		###
		setShowFoldWidgets: (show) ->
			@setOption "showFoldWidgets", show

		
		getShowFoldWidgets: ->
			@getOption "showFoldWidgets"

		setFadeFoldWidgets: (fade) ->
			@setOption "fadeFoldWidgets", fade

		###
		Returns `true` if the fold widgets are shown.
		@return {Boolean}
		###
		getFadeFoldWidgets: ->
			@getOption "fadeFoldWidgets"
	
	
	

		###
		Removes words of text from the editor. A "word" is defined as a string of characters bookended by whitespace.
		@param {String} dir The direction of the deletion to occur, either "left" or "right"
		###
		remove: (dir) ->
			if @selection.isEmpty()
				if dir is "left"
					@selection.selectLeft()
				else
					@selection.selectRight()
			range = @getSelectionRange()
			if @getBehavioursEnabled()
				session = @session
				state = session.getState(range.start.row)
				new_range = session.getMode().transformAction(state, "deletion", this, session, range)
				range = new_range  if new_range
			@session.remove range
			@clearSelection()

		###
		Removes the word directly to the right of the current selection.
		###
		removeWordRight: ->
			@selection.selectWordRight()  if @selection.isEmpty()
			@session.remove @getSelectionRange()
			@clearSelection()

		###
		Removes the word directly to the left of the current selection.
		###
		removeWordLeft: ->
			@selection.selectWordLeft()  if @selection.isEmpty()
			@session.remove @getSelectionRange()
			@clearSelection()

		###
		Removes all the words to the left of the current selection, until the start of the line.
		###
		removeToLineStart: ->
			@selection.selectLineStart()  if @selection.isEmpty()
			@session.remove @getSelectionRange()
			@clearSelection()

		###
		Removes all the words to the right of the current selection, until the end of the line.
		###
		removeToLineEnd: ->
			@selection.selectLineEnd()  if @selection.isEmpty()
			range = @getSelectionRange()
			if range.start.column is range.end.column and range.start.row is range.end.row
				range.end.column = 0
				range.end.row++
			@session.remove range
			@clearSelection()

		###
		Splits the line at the current selection (by inserting an `'\n'`).
		###
		splitLine: ->
			unless @selection.isEmpty()
				@session.remove @getSelectionRange()
				@clearSelection()
			cursor = @getCursorPosition()
			@insert "\n"
			@moveCursorToPosition cursor

		###
		Transposes current line.
		###
		transposeLetters: ->
			return  unless @selection.isEmpty()
			cursor = @getCursorPosition()
			column = cursor.column
			return  if column is 0
			line = @session.getLine(cursor.row)
			swap = undefined
			range = undefined
			if column < line.length
				swap = line.charAt(column) + line.charAt(column - 1)
				range = new Range(cursor.row, column - 1, cursor.row, column + 1)
			else
				swap = line.charAt(column - 1) + line.charAt(column - 2)
				range = new Range(cursor.row, column - 2, cursor.row, column)
			@session.replace range, swap

		###
		Converts the current selection entirely into lowercase.
		###
		toLowerCase: ->
			originalRange = @getSelectionRange()
			@selection.selectWord()  if @selection.isEmpty()
			range = @getSelectionRange()
			text = @session.getTextRange(range)
			@session.replace range, text.toLowerCase()
			@selection.setSelectionRange originalRange

		###
		Converts the current selection entirely into uppercase.
		###
		toUpperCase: ->
			originalRange = @getSelectionRange()
			@selection.selectWord()  if @selection.isEmpty()
			range = @getSelectionRange()
			text = @session.getTextRange(range)
			@session.replace range, text.toUpperCase()
			@selection.setSelectionRange originalRange

	
	
	
	
	
		###
		Inserts an indentation into the current cursor position or indents the selected lines.
		
		@related EditSession.indentRows
		###
		indent: ->
			session = @session
			range = @getSelectionRange()
			if range.start.row < range.end.row or range.start.column < range.end.column
				rows = @$getSelectedRows()
				session.indentRows rows.first, rows.last, "\t"
			else
				indentString = undefined
				if @session.getUseSoftTabs()
					size = session.getTabSize()
					position = @getCursorPosition()
					column = session.documentToScreenColumn(position.row, position.column)
					count = (size - column % size)
					indentString = lang.stringRepeat(" ", count)
				else
					indentString = "\t"
				@insert indentString

		###
		Indents the current line.
		@related EditSession.indentRows
		###
		blockIndent: ->
			rows = @$getSelectedRows()
			@session.indentRows rows.first, rows.last, "\t"

		###
		Outdents the current line.
		@related EditSession.outdentRows
		###
		blockOutdent: ->
			selection = @session.getSelection()
			@session.outdentRows selection.getRange()

		# TODO: move out of core when we have good mechanism for managing extensions
		sortLines: ->
			rows = @$getSelectedRows()
			session = @session
			lines = []
			i = rows.first
			while i <= rows.last
				lines.push session.getLine(i)
				i++
			lines.sort (a, b) ->
				return -1  if a.toLowerCase() < b.toLowerCase()
				return 1  if a.toLowerCase() > b.toLowerCase()
				0

			deleteRange = new Range(0, 0, 0, 0)
			i = rows.first

			while i <= rows.last
				line = session.getLine(i)
				deleteRange.start.row = i
				deleteRange.end.row = i
				deleteRange.end.column = line.length
				session.replace deleteRange, lines[i - rows.first]
				i++

		###
		Given the currently selected range, this function either comments all the lines, or uncomments all of them.
		###
		toggleCommentLines: ->
			state = @session.getState(@getCursorPosition().row)
			rows = @$getSelectedRows()
			@session.getMode().toggleCommentLines state, @session, rows.first, rows.last

		toggleBlockComment: ->
			cursor = @getCursorPosition()
			state = @session.getState(cursor.row)
			range = @getSelectionRange()
			@session.getMode().toggleBlockComment state, @session, range, cursor
	
		###
		Works like [[EditSession.getTokenAt]], except it returns a number.
		@returns {Number}
		###
		getNumberAt: (row, column) ->
			_numberRx = /[\-]?[0-9]+(?:\.[0-9]+)?/g
			_numberRx.lastIndex = 0
			s = @session.getLine(row)
			while _numberRx.lastIndex < column
				m = _numberRx.exec(s)
				if m.index <= column and m.index + m[0].length >= column
					number =
						value: m[0]
						start: m.index
						end: m.index + m[0].length

					return number
			null

		###
		If the character before the cursor is a number, this functions changes its value by `amount`.
		@param {Number} amount The value to change the numeral by (can be negative to decrease value)
		###
		modifyNumber: (amount) ->
			row = @selection.getCursor().row
			column = @selection.getCursor().column
			# get the char before the cursor
			charRange = new Range(row, column - 1, row, column)
			c = @session.getTextRange(charRange)
			# if the char is a digit
			if not isNaN(parseFloat(c)) and isFinite(c)
				# get the whole number the digit is part of
				nr = @getNumberAt(row, column)
				# if number found
				if nr
					fp = (if nr.value.indexOf(".") >= 0 then nr.start + nr.value.indexOf(".") + 1 else nr.end)
					decimals = nr.start + nr.value.length - fp
					t = parseFloat(nr.value)
					t *= Math.pow(10, decimals)
					if fp isnt nr.end and column < fp
						amount *= Math.pow(10, nr.end - column - 1)
					else
						amount *= Math.pow(10, nr.end - column)
					t += amount
					t /= Math.pow(10, decimals)
					nnr = t.toFixed(decimals)
					#update number
					replaceRange = new Range(row, nr.start, row, nr.end)
					@session.replace replaceRange, nnr
					#reposition the cursor
					@moveCursorTo row, Math.max(nr.start + 1, column + nnr.length - nr.value.length)

		removeLines: ->
			rows = @$getSelectedRows()
			range = undefined
			if rows.first is 0 or rows.last + 1 < @session.getLength()
				range = new Range(rows.first, 0, rows.last + 1, 0)
			else
				range = new Range(rows.first - 1, @session.getLine(rows.first - 1).length, rows.last, @session.getLine(rows.last).length)
			@session.remove range
			@clearSelection()

		###
		Removes all the lines in the current selection
		@related EditSession.remove
		###
		duplicateSelection: ->
			sel = @selection
			doc = @session
			range = sel.getRange()
			reverse = sel.isBackwards()
			if range.isEmpty()
				row = range.start.row
				doc.duplicateLines row, row
			else
				point = (if reverse then range.start else range.end)
				endPoint = doc.insert(point, doc.getTextRange(range), false)
				range.start = point
				range.end = endPoint
				sel.setSelectionRange range, reverse

		###
		Shifts all the selected lines down one row.
		
		@returns {Number} On success, it returns -1.
		@related EditSession.moveLinesUp
		###
		moveLinesDown: ->
			@$moveLines (firstRow, lastRow) ->
				@session.moveLinesDown firstRow, lastRow


		###
		Shifts all the selected lines up one row.
		@returns {Number} On success, it returns -1.
		@related EditSession.moveLinesDown
		###
		moveLinesUp: ->
			@$moveLines (firstRow, lastRow) ->
				@session.moveLinesUp firstRow, lastRow

		###
		Moves a range of text from the given range to the given position. `toPosition` is an object that looks like this:
		```json
		{ row: newRowLocation, column: newColumnLocation }
		```
		@param {Range} fromRange The range of text you want moved within the document
		@param {Object} toPosition The location (row and column) where you want to move the text to
		
		@returns {Range} The new range where the text was moved to.
		@related EditSession.moveText
		###
		moveText: (range, toPosition) ->
			@session.moveText range, toPosition

		###
		Copies all the selected lines up one row.
		@returns {Number} On success, returns 0.
		###
		copyLinesUp: ->
			@$moveLines (firstRow, lastRow) ->
				@session.duplicateLines firstRow, lastRow
				0

		###
		Copies all the selected lines down one row.
		@returns {Number} On success, returns the number of new rows added; in other words, `lastRow - firstRow + 1`.
		@related EditSession.duplicateLines
		###
		copyLinesDown: ->
			@$moveLines (firstRow, lastRow) ->
				@session.duplicateLines firstRow, lastRow

		###
		Executes a specific function, which can be anything that manipulates selected lines, such as copying them, duplicating them, or shifting them.
		@param {Function} mover A method to call on each selected row
		###
		$moveLines: (mover) ->
			selection = @selection
			if not selection.inMultiSelectMode or @inVirtualSelectionMode
				range = selection.toOrientedRange()
				rows = @$getSelectedRows(range)
				linesMoved = mover.call(this, rows.first, rows.last)
				range.moveBy linesMoved, 0
				selection.fromOrientedRange range
			else
				ranges = selection.rangeList.ranges
				selection.rangeList.detach @session
				i = ranges.length

				while i--
					rangeIndex = i
					rows = ranges[i].collapseRows()
					last = rows.end.row
					first = rows.start.row
					while i--
						rows = ranges[i].collapseRows()
						if first - rows.end.row <= 1
							first = rows.end.row
						else
							break
					i++
					linesMoved = mover.call(this, first, last)
					while rangeIndex >= i
						ranges[rangeIndex].moveBy linesMoved, 0
						rangeIndex--
				selection.fromOrientedRange selection.ranges[0]
				selection.rangeList.attach @session

		###
		Returns an object indicating the currently selected rows. The object looks like this:
		
		```json
		{ first: range.start.row, last: range.end.row }
		```
		
		@returns {Object}
		###
		$getSelectedRows: ->
			range = @getSelectionRange().collapseRows()
			first: range.start.row
			last: range.end.row

		onCompositionStart: (text) ->
			@renderer.showComposition @getCursorPosition()

		onCompositionUpdate: (text) ->
			@renderer.setCompositionText text

		onCompositionEnd: ->
			@renderer.hideComposition()

		###
		{:VirtualRenderer.getFirstVisibleRow}
		
		@returns {Number}
		@related VirtualRenderer.getFirstVisibleRow
		###
		getFirstVisibleRow: ->
			@renderer.getFirstVisibleRow()

		###
		{:VirtualRenderer.getLastVisibleRow}
		
		@returns {Number}
		@related VirtualRenderer.getLastVisibleRow
		###
		getLastVisibleRow: ->
			@renderer.getLastVisibleRow()

		###
		Indicates if the row is currently visible on the screen.
		@param {Number} row The row to check
		
		@returns {Boolean}
		###
		isRowVisible: (row) ->
			row >= @getFirstVisibleRow() and row <= @getLastVisibleRow()

		###
		Indicates if the entire row is currently visible on the screen.
		@param {Number} row The row to check
		
		
		@returns {Boolean}
		###
		isRowFullyVisible: (row) ->
			row >= @renderer.getFirstFullyVisibleRow() and row <= @renderer.getLastFullyVisibleRow()

		###
		Returns the number of currently visibile rows.
		@returns {Number}
		###
		$getVisibleRowCount: ->
			@renderer.getScrollBottomRow() - @renderer.getScrollTopRow() + 1

		$moveByPage: (dir, select) ->
			renderer = @renderer
			config = @renderer.layerConfig
			rows = dir * Math.floor(config.height / config.lineHeight)
			@$blockScrolling++
			if select is true
				@selection.$moveSelection ->
					@moveCursorBy rows, 0

			else if select is false
				@selection.moveCursorBy rows, 0
				@selection.clearSelection()
			@$blockScrolling--
			scrollTop = renderer.scrollTop
			renderer.scrollBy 0, rows * config.lineHeight
			renderer.scrollCursorIntoView null, 0.5  if select?
			renderer.animateScrolling scrollTop

		###
		Selects the text from the current position of the document until where a "page down" finishes.
		###
		selectPageDown: ->
			@$moveByPage 1, true

		###
		Selects the text from the current position of the document until where a "page up" finishes.
		###
		selectPageUp: ->
			@$moveByPage -1, true

		###
		Shifts the document to wherever "page down" is, as well as moving the cursor position.
		###
		gotoPageDown: ->
			@$moveByPage 1, false

		###
		Shifts the document to wherever "page up" is, as well as moving the cursor position.
		###
		gotoPageUp: ->
			@$moveByPage -1, false

		###
		Scrolls the document to wherever "page down" is, without changing the cursor position.
		###
		scrollPageDown: ->
			@$moveByPage 1

		###
		Scrolls the document to wherever "page up" is, without changing the cursor position.
		###
		scrollPageUp: ->
			@$moveByPage -1

		###
		Moves the editor to the specified row.
		@related VirtualRenderer.scrollToRow
		###
		scrollToRow: (row) ->
			@renderer.scrollToRow row
	
		###
		Scrolls to a line. If `center` is `true`, it puts the line in middle of screen (or attempts to).
		@param {Number} line The line to scroll to
		@param {Boolean} center If `true`
		@param {Boolean} animate If `true` animates scrolling
		@param {Function} callback Function to be called when the animation has finished
		
		
		@related VirtualRenderer.scrollToLine
		###
		scrollToLine: (line, center, animate, callback) ->
			@renderer.scrollToLine line, center, animate, callback

		###
		Attempts to center the current selection on the screen.
		###
		centerSelection: ->
			range = @getSelectionRange()
			pos =
				row: Math.floor(range.start.row + (range.end.row - range.start.row) / 2)
				column: Math.floor(range.start.column + (range.end.column - range.start.column) / 2)

			@renderer.alignCursor pos, 0.5

		###
		Gets the current position of the cursor.
		@returns {Object} An object that looks something like this:
		
		```json
		{ row: currRow, column: currCol }
		```
		
		@related Selection.getCursor
		###
		getCursorPosition: ->
			@selection.getCursor()

		###
		Returns the screen position of the cursor.
		@returns {Number}
		@related EditSession.documentToScreenPosition
		###
		getCursorPositionScreen: ->
			@session.documentToScreenPosition @getCursorPosition()

		###
		{:Selection.getRange}
		@returns {Range}
		@related Selection.getRange
		###
		getSelectionRange: ->
			@selection.getRange()

		###
		Selects all the text in editor.
		@related Selection.selectAll
		###
		selectAll: ->
			@$blockScrolling += 1
			@selection.selectAll()
			@$blockScrolling -= 1

		###
		{:Selection.clearSelection}
		@related Selection.clearSelection
		###
		clearSelection: ->
			@selection.clearSelection()

		###
		Moves the cursor to the specified row and column. Note that this does not de-select the current selection.
		@param {Number} row The new row number
		@param {Number} column The new column number
		
		
		@related Selection.moveCursorTo
		###
		moveCursorTo: (row, column) ->
			@selection.moveCursorTo row, column

		###
		Moves the cursor to the position indicated by `pos.row` and `pos.column`.
		@param {Object} pos An object with two properties, row and column
		
		@related Selection.moveCursorToPosition
		###
		moveCursorToPosition: (pos) ->
			@selection.moveCursorToPosition pos

		###
		Moves the cursor's row and column to the next matching bracket.
		###
		jumpToMatching: (select) ->
			cursor = @getCursorPosition()
			range = @session.getBracketRange(cursor)
			unless range
				range = @find(
					needle: /[{}()\[\]]/g
					preventScroll: true
					start:
						row: cursor.row
						column: cursor.column - 1
				)
				return  unless range
				pos = range.start
				range = @session.getBracketRange(pos)  if pos.row is cursor.row and Math.abs(pos.column - cursor.column) < 2
			pos = range and range.cursor or pos
			if pos
				if select
					if range and range.isEqual(@getSelectionRange())
						@clearSelection()
					else
						@selection.selectTo pos.row, pos.column
				else
					@clearSelection()
					@moveCursorTo pos.row, pos.column

	
		###
		Moves the cursor to the specified line number, and also into the indiciated column.
		@param {Number} lineNumber The line number to go to
		@param {Number} column A column number to go to
		@param {Boolean} animate If `true` animates scolling
		###
		gotoLine: (lineNumber, column, animate) ->
			@selection.clearSelection()
			@session.unfold
				row: lineNumber - 1
				column: column or 0

			@$blockScrolling += 1

			# todo: find a way to automatically exit multiselect mode
			@exitMultiSelectMode and @exitMultiSelectMode()
			@moveCursorTo lineNumber - 1, column or 0
			@$blockScrolling -= 1
			@scrollToLine lineNumber - 1, true, animate  unless @isRowFullyVisible(lineNumber - 1)
	
		###
		Moves the cursor to the specified row and column. Note that this does de-select the current selection.
		@param {Number} row The new row number
		@param {Number} column The new column number
		
		
		@related Editor.moveCursorTo
		###
		navigateTo: (row, column) ->
			@clearSelection()
			@moveCursorTo row, column

		###
		Moves the cursor up in the document the specified number of times. Note that this does de-select the current selection.
		@param {Number} times The number of times to change navigation
		###
		navigateUp: (times) ->
			if @selection.isMultiLine() and not @selection.isBackwards()
				selectionStart = @selection.anchor.getPosition()
				return @moveCursorToPosition(selectionStart)
			@selection.clearSelection()
			times = times or 1
			@selection.moveCursorBy -times, 0

		
		###
		Moves the cursor down in the document the specified number of times. Note that this does de-select the current selection.
		@param {Number} times The number of times to change navigation
		###
		navigateDown: (times) ->
			if @selection.isMultiLine() and @selection.isBackwards()
				selectionEnd = @selection.anchor.getPosition()
				return @moveCursorToPosition(selectionEnd)
			@selection.clearSelection()
			times = times or 1
			@selection.moveCursorBy times, 0

		
		###
		Moves the cursor left in the document the specified number of times. Note that this does de-select the current selection.
		@param {Number} times The number of times to change navigation
		###
		navigateLeft: (times) ->
			unless @selection.isEmpty()
				selectionStart = @getSelectionRange().start
				@moveCursorToPosition selectionStart
			else
				times = times or 1
				@selection.moveCursorLeft()  while times--
			@clearSelection()
	

		
		###
		Moves the cursor right in the document the specified number of times. Note that this does de-select the current selection.
		@param {Number} times The number of times to change navigation
		###
		navigateRight: (times) ->
			unless @selection.isEmpty()
				selectionEnd = @getSelectionRange().end
				@moveCursorToPosition selectionEnd
			else
				times = times or 1
				@selection.moveCursorRight()  while times--
			@clearSelection()

		###
		Moves the cursor to the start of the current line. Note that this does de-select the current selection.
		###
		navigateLineStart: ->
			@selection.moveCursorLineStart()
			@clearSelection()

		###
		Moves the cursor to the end of the current line. Note that this does de-select the current selection.
		###
		navigateLineEnd: ->
			@selection.moveCursorLineEnd()
			@clearSelection()

		###
		Moves the cursor to the end of the current file. Note that this does de-select the current selection.
		###
		navigateFileEnd: ->
			scrollTop = @renderer.scrollTop
			@selection.moveCursorFileEnd()
			@clearSelection()
			@renderer.animateScrolling scrollTop

		###
		Moves the cursor to the start of the current file. Note that this does de-select the current selection.
		###
		navigateFileStart: ->
			scrollTop = @renderer.scrollTop
			@selection.moveCursorFileStart()
			@clearSelection()
			@renderer.animateScrolling scrollTop

		###
		Moves the cursor to the word immediately to the right of the current position. Note that this does de-select the current selection.
		###
		navigateWordRight: ->
			@selection.moveCursorWordRight()
			@clearSelection()

		###
		Moves the cursor to the word immediately to the left of the current position. Note that this does de-select the current selection.
		###
		navigateWordLeft: ->
			@selection.moveCursorWordLeft()
			@clearSelection()

		###
		Replaces the first occurance of `options.needle` with the value in `replacement`.
		@param {String} replacement The text to replace with
		@param {Object} options The [[Search `Search`]] options to use
		###
		replace: (replacement, options) ->
			@$search.set options  if options
			range = @$search.find(@session)
			replaced = 0
			return replaced  unless range
			replaced = 1  if @$tryReplace(range, replacement)
			if range isnt null
				@selection.setSelectionRange range
				@renderer.scrollSelectionIntoView range.start, range.end
			replaced

		###
		Replaces all occurances of `options.needle` with the value in `replacement`.
		@param {String} replacement The text to replace with
		@param {Object} options The [[Search `Search`]] options to use
		###
		replaceAll: (replacement, options) ->
			@$search.set options  if options
			ranges = @$search.findAll(@session)
			replaced = 0
			return replaced  unless ranges.length
			@$blockScrolling += 1
			selection = @getSelectionRange()
			@clearSelection()
			@selection.moveCursorTo 0, 0
			i = ranges.length - 1

			while i >= 0
				replaced++  if @$tryReplace(ranges[i], replacement)
				--i
			@selection.setSelectionRange selection
			@$blockScrolling -= 1
			replaced

		$tryReplace: (range, replacement) ->
			input = @session.getTextRange(range)
			replacement = @$search.replace(input, replacement)
			if replacement isnt null
				range.end = @session.replace(range, replacement)
				range
			else
				null

		###
		{:Search.getOptions} For more information on `options`, see [[Search `Search`]].
		@related Search.getOptions
		@returns {Object}
		###
		getLastSearchOptions: ->
			@$search.getOptions()

		
		###
		Attempts to find `needle` within the document. For more information on `options`, see [[Search `Search`]].
		@param {String} needle The text to search for (optional)
		@param {Object} options An object defining various search properties
		@param {Boolean} animate If `true` animate scrolling
		
		
		@related Search.find
		###
		find: (needle, options, animate) ->
			options = {}  unless options
			if typeof needle is "string" or needle instanceof RegExp
				options.needle = needle
			else oop.mixin options, needle  if typeof needle is "object"
			range = @selection.getRange()
			unless options.needle?
				needle = @session.getTextRange(range) or @$search.$options.needle
				unless needle
					range = @session.getWordRange(range.start.row, range.start.column)
					needle = @session.getTextRange(range)
				@$search.set needle: needle
			@$search.set options
			@$search.set start: range  unless options.start
			newRange = @$search.find(@session)
			return newRange  if options.preventScroll
			if newRange
				@revealRange newRange, animate
				return newRange
			# clear selection if nothing is found
			if options.backwards
				range.start = range.end
			else
				range.end = range.start
			@selection.setRange range

		###
		Performs another search for `needle` in the document. For more information on `options`, see [[Search `Search`]].
		@param {Object} options search options
		@param {Boolean} animate If `true` animate scrolling
		
		
		@related Editor.find
		###
		findNext: (options, animate) ->
			@find
				skipCurrent: true
				backwards: false
			, options, animate

		###
		Performs a search for `needle` backwards. For more information on `options`, see [[Search `Search`]].
		@param {Object} options search options
		@param {Boolean} animate If `true` animate scrolling
		
		
		@related Editor.find
		###
		findPrevious: (options, animate) ->
			@find options,
				skipCurrent: true
				backwards: true
			, animate

		revealRange: (range, animate) ->
			@$blockScrolling += 1
			@session.unfold range
			@selection.setSelectionRange range
			@$blockScrolling -= 1
			scrollTop = @renderer.scrollTop
			@renderer.scrollSelectionIntoView range.start, range.end, 0.5
			@renderer.animateScrolling scrollTop  unless animate is false

		###
		{:UndoManager.undo}
		@related UndoManager.undo
		###
		undo: ->
			@$blockScrolling++
			@session.getUndoManager().undo()
			@$blockScrolling--
			@renderer.scrollCursorIntoView null, 0.5

		###
		{:UndoManager.redo}
		@related UndoManager.redo
		###
		redo: ->
			@$blockScrolling++
			@session.getUndoManager().redo()
			@$blockScrolling--
			@renderer.scrollCursorIntoView null, 0.5

		###
		Cleans up the entire editor.
		###
		destroy: ->
			@renderer.destroy()
			@_emit "destroy", this

		###
		Enables automatic scrolling of the cursor into view when editor itself is inside scrollable element
		@param {Boolean} enable default true
		###
		setAutoScrollEditorIntoView: (enable) ->
			return  if enable is false
			rect = undefined
			self = this
			shouldScroll = false
			@$scrollAnchor = document.createElement("div")  unless @$scrollAnchor
			scrollAnchor = @$scrollAnchor
			scrollAnchor.style.cssText = "position:absolute"
			@container.insertBefore scrollAnchor, @container.firstChild
			onChangeSelection = @on("changeSelection", ->
				shouldScroll = true
			)
			onBeforeRender = @renderer.on("beforeRender", ->
				rect = self.renderer.container.getBoundingClientRect()  if shouldScroll
			)
			onAfterRender = @renderer.on("afterRender", ->
				if shouldScroll and rect and self.isFocused()
					renderer = self.renderer
					pos = renderer.$cursorLayer.$pixelPos
					config = renderer.layerConfig
					top = pos.top - config.offset
					if pos.top >= 0 and top + rect.top < 0
						shouldScroll = true
					else if pos.top < config.height and pos.top + rect.top + config.lineHeight > window.innerHeight
						shouldScroll = false
					else
						shouldScroll = null
					if shouldScroll?
						scrollAnchor.style.top = top + "px"
						scrollAnchor.style.left = pos.left + "px"
						scrollAnchor.style.height = config.lineHeight + "px"
						scrollAnchor.scrollIntoView shouldScroll
					shouldScroll = rect = null
			)

			setAutoScrollEditorIntoView: (enable) ->
				return  if enable is true
				delete @setAutoScrollEditorIntoView

				@removeEventListener "changeSelection", onChangeSelection
				@renderer.removeEventListener "afterRender", onAfterRender
				@renderer.removeEventListener "beforeRender", onBeforeRender

		$resetCursorStyle: ->
			style = @$cursorStyle or "ace"
			cursorLayer = @renderer.$cursorLayer
			return  unless cursorLayer
			cursorLayer.setSmoothBlinking style is "smooth"
			cursorLayer.isBlinking = not @$readOnly and style isnt "wide"


	config.defineOptions Editor.prototype, "editor",
		selectionStyle:
			set: (style) ->
				@onSelectionChange()
				@_emit "changeSelectionStyle",
					data: style


			initialValue: "line"

		highlightActiveLine:
			set: ->
				@$updateHighlightActiveLine()

			initialValue: true

		highlightSelectedWord:
			set: (shouldHighlight) ->
				@$onSelectionChange()

			initialValue: true

		readOnly:
			set: (readOnly) ->
				@$resetCursorStyle()

			initialValue: false

		cursorStyle:
			set: (val) ->
				@$resetCursorStyle()

			values: ["ace", "slim", "smooth", "wide"]
			initialValue: "ace"

		behavioursEnabled:
			initialValue: true

		wrapBehavioursEnabled:
			initialValue: true

		hScrollBarAlwaysVisible: "renderer"
		highlightGutterLine: "renderer"
		animatedScroll: "renderer"
		showInvisibles: "renderer"
		showPrintMargin: "renderer"
		printMarginColumn: "renderer"
		printMargin: "renderer"
		fadeFoldWidgets: "renderer"
		showFoldWidgets: "renderer"
		showGutter: "renderer"
		displayIndentGuides: "renderer"
		fontSize: "renderer"
		fontFamily: "renderer"
		scrollSpeed: "$mouseHandler"
		dragDelay: "$mouseHandler"
		focusTimout: "$mouseHandler"
		firstLineNumber: "session"
		overwrite: "session"
		newLineMode: "session"
		useWorker: "session"
		useSoftTabs: "session"
		tabSize: "session"
		wrap: "session"
		foldStyle: "session"

	return Editor
