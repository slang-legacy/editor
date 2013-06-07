(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["ace/lib/fixoldbrowsers", "ace/lib/oop", "ace/lib/dom", "ace/lib/lang", "ace/lib/useragent", "ace/keyboard/textinput", "ace/mouse/mouse_handler", "ace/mouse/fold_handler", "ace/keyboard/keybinding", "ace/edit_session", "ace/search", "ace/range", "extend_ace/lib/event_emitter", "ace/commands/command_manager", "ace/commands/default_commands", "ace/config"], function() {
    var CommandManager, EditSession, Editor, EventEmitter, FoldHandler, KeyBinding, MouseHandler, Range, Search, TextInput, config, defaultCommands, dom, lang, oop, useragent;

    require("ace/lib/fixoldbrowsers");
    oop = require("ace/lib/oop");
    dom = require("ace/lib/dom");
    lang = require("ace/lib/lang");
    useragent = require("ace/lib/useragent");
    TextInput = require("ace/keyboard/textinput").TextInput;
    MouseHandler = require("ace/mouse/mouse_handler").MouseHandler;
    FoldHandler = require("ace/mouse/fold_handler").FoldHandler;
    KeyBinding = require("ace/keyboard/keybinding").KeyBinding;
    EditSession = require("ace/edit_session").EditSession;
    Search = require("ace/search").Search;
    Range = require("ace/range").Range;
    EventEmitter = require("extend_ace/lib/event_emitter");
    CommandManager = require("ace/commands/command_manager").CommandManager;
    defaultCommands = require("ace/commands/default_commands").commands;
    config = require("ace/config");
    console.log(EventEmitter);
    /*
    	The main entry point into the Ace functionality.
    	
    	The `Editor` manages the [[EditSession]] (which manages [[Document]]s), as well as the [[VirtualRenderer]], which draws everything to the screen.
    	
    	Event sessions dealing with the mouse and keyboard are bubbled up from `Document` to the `Editor`, which decides what to do with them.
    	@class Editor
    */

    Editor = (function(_super) {
      __extends(Editor, _super);

      /*
      		Creates a new `Editor` object.
      		
      		@param {VirtualRenderer} renderer Associated `VirtualRenderer` that draws everything
      		@param {EditSession} session The `EditSession` to refer to
      		
      		@constructor
      */


      function Editor(renderer, session) {
        var container;

        container = renderer.getContainerElement();
        this.container = container;
        this.renderer = renderer;
        this.commands = new CommandManager((useragent.isMac ? "mac" : "win"), defaultCommands);
        this.textInput = new TextInput(renderer.getTextAreaContainer(), this);
        this.renderer.textarea = this.textInput.getElement();
        this.keyBinding = new KeyBinding(this);
        this.$mouseHandler = new MouseHandler(this);
        new FoldHandler(this);
        this.$blockScrolling = 0;
        this.$search = new Search().set({
          wrap: true
        });
        this.setSession(session || new EditSession(""));
        config.resetOptions(this);
        config._emit("editor", this);
      }

      /*
      		Sets a new key handler, such as "vim" or "windows".
      		@param {String} keyboardHandler The new key handler
      */


      Editor.prototype.setKeyboardHandler = function(keyboardHandler) {
        var _self;

        if (!keyboardHandler) {
          return this.keyBinding.setKeyboardHandler(null);
        } else if (typeof keyboardHandler === "string") {
          this.$keybindingId = keyboardHandler;
          _self = this;
          return config.loadModule(["keybinding", keyboardHandler], function(module) {
            if (_self.$keybindingId === keyboardHandler) {
              return _self.keyBinding.setKeyboardHandler(module && module.handler);
            }
          });
        } else {
          delete this.$keybindingId;
          return this.keyBinding.setKeyboardHandler(keyboardHandler);
        }
      };

      /*
      		Returns the keyboard handler, such as "vim" or "windows".
      		
      		@returns {String}
      */


      Editor.prototype.getKeyboardHandler = function() {
        return this.keyBinding.getKeyboardHandler();
      };

      /*
      		Emitted whenever the [[EditSession]] changes.
      		@event changeSession
      		@param {Object} e An object with two properties, `oldSession` and `session`, that represent the old and new [[EditSession]]s.
      */


      /*
      		Sets a new editsession to use. This method also emits the `'changeSession'` event.
      		@param {EditSession} session The new session to use
      */


      Editor.prototype.setSession = function(session) {
        var oldSession, selection;

        if (this.session === session) {
          return;
        }
        if (this.session) {
          oldSession = this.session;
          this.session.removeEventListener("change", this.$onDocumentChange);
          this.session.removeEventListener("changeMode", this.$onChangeMode);
          this.session.removeEventListener("tokenizerUpdate", this.$onTokenizerUpdate);
          this.session.removeEventListener("changeTabSize", this.$onChangeTabSize);
          this.session.removeEventListener("changeWrapLimit", this.$onChangeWrapLimit);
          this.session.removeEventListener("changeWrapMode", this.$onChangeWrapMode);
          this.session.removeEventListener("onChangeFold", this.$onChangeFold);
          this.session.removeEventListener("changeFrontMarker", this.$onChangeFrontMarker);
          this.session.removeEventListener("changeBackMarker", this.$onChangeBackMarker);
          this.session.removeEventListener("changeBreakpoint", this.$onChangeBreakpoint);
          this.session.removeEventListener("changeAnnotation", this.$onChangeAnnotation);
          this.session.removeEventListener("changeOverwrite", this.$onCursorChange);
          this.session.removeEventListener("changeScrollTop", this.$onScrollTopChange);
          this.session.removeEventListener("changeScrollLeft", this.$onScrollLeftChange);
          selection = this.session.getSelection();
          selection.removeEventListener("changeCursor", this.$onCursorChange);
          selection.removeEventListener("changeSelection", this.$onSelectionChange);
        }
        this.session = session;
        this.$onDocumentChange = this.onDocumentChange.bind(this);
        session.addEventListener("change", this.$onDocumentChange);
        this.renderer.setSession(session);
        this.$onChangeMode = this.onChangeMode.bind(this);
        session.addEventListener("changeMode", this.$onChangeMode);
        this.$onTokenizerUpdate = this.onTokenizerUpdate.bind(this);
        session.addEventListener("tokenizerUpdate", this.$onTokenizerUpdate);
        this.$onChangeTabSize = this.renderer.onChangeTabSize.bind(this.renderer);
        session.addEventListener("changeTabSize", this.$onChangeTabSize);
        this.$onChangeWrapLimit = this.onChangeWrapLimit.bind(this);
        session.addEventListener("changeWrapLimit", this.$onChangeWrapLimit);
        this.$onChangeWrapMode = this.onChangeWrapMode.bind(this);
        session.addEventListener("changeWrapMode", this.$onChangeWrapMode);
        this.$onChangeFold = this.onChangeFold.bind(this);
        session.addEventListener("changeFold", this.$onChangeFold);
        this.$onChangeFrontMarker = this.onChangeFrontMarker.bind(this);
        this.session.addEventListener("changeFrontMarker", this.$onChangeFrontMarker);
        this.$onChangeBackMarker = this.onChangeBackMarker.bind(this);
        this.session.addEventListener("changeBackMarker", this.$onChangeBackMarker);
        this.$onChangeBreakpoint = this.onChangeBreakpoint.bind(this);
        this.session.addEventListener("changeBreakpoint", this.$onChangeBreakpoint);
        this.$onChangeAnnotation = this.onChangeAnnotation.bind(this);
        this.session.addEventListener("changeAnnotation", this.$onChangeAnnotation);
        this.$onCursorChange = this.onCursorChange.bind(this);
        this.session.addEventListener("changeOverwrite", this.$onCursorChange);
        this.$onScrollTopChange = this.onScrollTopChange.bind(this);
        this.session.addEventListener("changeScrollTop", this.$onScrollTopChange);
        this.$onScrollLeftChange = this.onScrollLeftChange.bind(this);
        this.session.addEventListener("changeScrollLeft", this.$onScrollLeftChange);
        this.selection = session.getSelection();
        this.selection.addEventListener("changeCursor", this.$onCursorChange);
        this.$onSelectionChange = this.onSelectionChange.bind(this);
        this.selection.addEventListener("changeSelection", this.$onSelectionChange);
        this.onChangeMode();
        this.$blockScrolling += 1;
        this.onCursorChange();
        this.$blockScrolling -= 1;
        this.onScrollTopChange();
        this.onScrollLeftChange();
        this.onSelectionChange();
        this.onChangeFrontMarker();
        this.onChangeBackMarker();
        this.onChangeBreakpoint();
        this.onChangeAnnotation();
        this.session.getUseWrapMode() && this.renderer.adjustWrapLimit();
        this.renderer.updateFull();
        return this._emit("changeSession", {
          session: session,
          oldSession: oldSession
        });
      };

      /*
      		Returns the current session being used.
      		@returns {EditSession}
      */


      Editor.prototype.getSession = function() {
        return this.session;
      };

      /*
      		Sets the current document to `val`.
      		@param {String} val The new value to set for the document
      		@param {Number} cursorPos Where to set the new value. `undefined` or 0 is selectAll, -1 is at the document start, and 1 is at the end
      		
      		@returns {String} The current document value
      		@related Document.setValue
      */


      Editor.prototype.setValue = function(val, cursorPos) {
        this.session.doc.setValue(val);
        if (!cursorPos) {
          this.selectAll();
        } else if (cursorPos === 1) {
          this.navigateFileEnd();
        } else {
          if (cursorPos === -1) {
            this.navigateFileStart();
          }
        }
        return val;
      };

      /*
      		Returns the current session's content.
      		
      		@returns {String}
      		@related EditSession.getValue
      */


      Editor.prototype.getValue = function() {
        return this.session.getValue();
      };

      /*
      		Returns the currently highlighted selection.
      		@returns {String} The highlighted selection
      */


      Editor.prototype.getSelection = function() {
        return this.selection;
      };

      /*
      		{:VirtualRenderer.onResize}
      		@param {Boolean} force If `true`, recomputes the size, even if the height and width haven't changed
      		
      		
      		@related VirtualRenderer.onResize
      */


      Editor.prototype.resize = function(force) {
        return this.renderer.onResize(force);
      };

      /*
      		{:VirtualRenderer.setTheme}
      		@param {String} theme The path to a theme
      */


      Editor.prototype.setTheme = function(theme) {
        return this.renderer.setTheme(theme);
      };

      /*
      		{:VirtualRenderer.getTheme}
      		
      		@returns {String} The set theme
      		@related VirtualRenderer.getTheme
      */


      Editor.prototype.getTheme = function() {
        return this.renderer.getTheme();
      };

      /*
      		{:VirtualRenderer.setStyle}
      		@param {String} style A class name
      		
      		
      		@related VirtualRenderer.setStyle
      */


      Editor.prototype.setStyle = function(style) {
        return this.renderer.setStyle(style);
      };

      /*
      		{:VirtualRenderer.unsetStyle}
      		@related VirtualRenderer.unsetStyle
      */


      Editor.prototype.unsetStyle = function(style) {
        return this.renderer.unsetStyle(style);
      };

      /*
      		Gets the current font size of the editor text.
      */


      Editor.prototype.getFontSize = function() {
        return this.getOption("fontSize") || dom.computedStyle(this.container, "fontSize");
      };

      /*
      		Set a new font size (in pixels) for the editor text.
      		@param {String} size A font size ( _e.g._ "12px")
      */


      Editor.prototype.setFontSize = function(size) {
        return this.setOption("fontSize", size);
      };

      Editor.prototype.$highlightBrackets = function() {
        var self;

        if (this.session.$bracketHighlight) {
          this.session.removeMarker(this.session.$bracketHighlight);
          this.session.$bracketHighlight = null;
        }
        if (this.$highlightPending) {
          return;
        }
        self = this;
        this.$highlightPending = true;
        return setTimeout((function() {
          var pos, range;

          self.$highlightPending = false;
          pos = self.session.findMatchingBracket(self.getCursorPosition());
          if (pos) {
            range = new Range(pos.row, pos.column, pos.row, pos.column + 1);
          } else {
            if (self.session.$mode.getMatching) {
              range = self.session.$mode.getMatching(self.session);
            }
          }
          if (range) {
            return self.session.$bracketHighlight = self.session.addMarker(range, "ace_bracket", "text");
          }
        }), 50);
      };

      /*
      		Brings the current `textInput` into focus.
      */


      Editor.prototype.focus = function() {
        var _self;

        _self = this;
        setTimeout(function() {
          return _self.textInput.focus();
        });
        return this.textInput.focus();
      };

      /*
      		Returns `true` if the current `textInput` is in focus.
      		@return {Boolean}
      */


      Editor.prototype.isFocused = function() {
        return this.textInput.isFocused();
      };

      /*
      		Blurs the current `textInput`.
      */


      Editor.prototype.blur = function() {
        return this.textInput.blur();
      };

      /*
      		Emitted once the editor comes into focus.
      		@event focus
      */


      Editor.prototype.onFocus = function() {
        if (this.$isFocused) {
          return;
        }
        this.$isFocused = true;
        this.renderer.showCursor();
        this.renderer.visualizeFocus();
        return this._emit("focus");
      };

      /*
      		Emitted once the editor has been blurred.
      		@event blur
      */


      Editor.prototype.onBlur = function() {
        if (!this.$isFocused) {
          return;
        }
        this.$isFocused = false;
        this.renderer.hideCursor();
        this.renderer.visualizeBlur();
        return this._emit("blur");
      };

      Editor.prototype.$cursorChange = function() {
        return this.renderer.updateCursor();
      };

      /*
      		Emitted whenever the document is changed.
      		@event change
      		@param {Object} e Contains a single property, `data`, which has the delta of changes
      */


      Editor.prototype.onDocumentChange = function(e) {
        var delta, lastRow, range;

        delta = e.data;
        range = delta.range;
        lastRow = void 0;
        if (range.start.row === range.end.row && delta.action !== "insertLines" && delta.action !== "removeLines") {
          lastRow = range.end.row;
        } else {
          lastRow = Infinity;
        }
        this.renderer.updateLines(range.start.row, lastRow);
        this._emit("change", e);
        return this.$cursorChange();
      };

      Editor.prototype.onTokenizerUpdate = function(e) {
        var rows;

        rows = e.data;
        return this.renderer.updateLines(rows.first, rows.last);
      };

      Editor.prototype.onScrollTopChange = function() {
        return this.renderer.scrollToY(this.session.getScrollTop());
      };

      Editor.prototype.onScrollLeftChange = function() {
        return this.renderer.scrollToX(this.session.getScrollLeft());
      };

      /*
      		Emitted when the selection changes.
      */


      Editor.prototype.onCursorChange = function() {
        this.$cursorChange();
        if (!this.$blockScrolling) {
          this.renderer.scrollCursorIntoView();
        }
        this.$highlightBrackets();
        this.$updateHighlightActiveLine();
        return this._emit("changeSelection");
      };

      Editor.prototype.$updateHighlightActiveLine = function() {
        var highlight, range, session;

        session = this.getSession();
        highlight = void 0;
        if (this.$highlightActiveLine ? this.$selectionStyle !== "line" || !this.selection.isMultiLine() : void 0) {
          highlight = this.getCursorPosition();
        }
        if (session.$highlightLineMarker && !highlight) {
          session.removeMarker(session.$highlightLineMarker.id);
          return session.$highlightLineMarker = null;
        } else if (!session.$highlightLineMarker && highlight) {
          range = new Range(highlight.row, highlight.column, highlight.row, Infinity);
          range.id = session.addMarker(range, "ace_active-line", "screenLine");
          return session.$highlightLineMarker = range;
        } else if (highlight) {
          session.$highlightLineMarker.start.row = highlight.row;
          session.$highlightLineMarker.end.row = highlight.row;
          session.$highlightLineMarker.start.column = highlight.column;
          return session._emit("changeBackMarker");
        }
      };

      Editor.prototype.onSelectionChange = function(e) {
        var range, re, session, style;

        session = this.session;
        if (session.$selectionMarker) {
          session.removeMarker(session.$selectionMarker);
        }
        session.$selectionMarker = null;
        if (!this.selection.isEmpty()) {
          range = this.selection.getRange();
          style = this.getSelectionStyle();
          session.$selectionMarker = session.addMarker(range, "ace_selection", style);
        } else {
          this.$updateHighlightActiveLine();
        }
        re = this.$highlightSelectedWord && this.$getSelectionHighLightRegexp();
        this.session.highlight(re);
        return this._emit("changeSelection");
      };

      Editor.prototype.$getSelectionHighLightRegexp = function() {
        var endOuter, line, lineCols, needle, re, selection, session, startOuter;

        session = this.session;
        selection = this.getSelectionRange();
        if (selection.isEmpty() || selection.isMultiLine()) {
          return;
        }
        startOuter = selection.start.column - 1;
        endOuter = selection.end.column + 1;
        line = session.getLine(selection.start.row);
        lineCols = line.length;
        needle = line.substring(Math.max(startOuter, 0), Math.min(endOuter, lineCols));
        if ((startOuter >= 0 && /^[\w\d]/.test(needle)) || (endOuter <= lineCols && /[\w\d]$/.test(needle))) {
          return;
        }
        needle = line.substring(selection.start.column, selection.end.column);
        if (!/^[\w\d]+$/.test(needle)) {
          return;
        }
        re = this.$search.$assembleRegExp({
          wholeWord: true,
          caseSensitive: true,
          needle: needle
        });
        return re;
      };

      Editor.prototype.onChangeFrontMarker = function() {
        return this.renderer.updateFrontMarkers();
      };

      Editor.prototype.onChangeBackMarker = function() {
        return this.renderer.updateBackMarkers();
      };

      Editor.prototype.onChangeBreakpoint = function() {
        return this.renderer.updateBreakpoints();
      };

      Editor.prototype.onChangeAnnotation = function() {
        return this.renderer.setAnnotations(this.session.getAnnotations());
      };

      Editor.prototype.onChangeMode = function(e) {
        this.renderer.updateText();
        return this._emit("changeMode", e);
      };

      Editor.prototype.onChangeWrapLimit = function() {
        return this.renderer.updateFull();
      };

      Editor.prototype.onChangeWrapMode = function() {
        return this.renderer.onResize(true);
      };

      Editor.prototype.onChangeFold = function() {
        this.$updateHighlightActiveLine();
        return this.renderer.updateFull();
      };

      /*
      		Emitted when text is copied.
      		@event copy
      		@param {String} text The copied text
      */


      /*
      		Returns the string of text currently highlighted.
      		@returns {String}
      */


      Editor.prototype.getCopyText = function() {
        var text;

        text = "";
        if (!this.selection.isEmpty()) {
          text = this.session.getTextRange(this.getSelectionRange());
        }
        this._emit("copy", text);
        return text;
      };

      /*
      		Called whenever a text "copy" happens.
      */


      Editor.prototype.onCopy = function() {
        return this.commands.exec("copy", this);
      };

      /*
      		Called whenever a text "cut" happens.
      */


      Editor.prototype.onCut = function() {
        return this.commands.exec("cut", this);
      };

      /*
      		Emitted when text is pasted.
      		@event paste
      		@param {String} text The pasted text
      */


      /*
      		Called whenever a text "paste" happens.
      		@param {String} text The pasted text
      */


      Editor.prototype.onPaste = function(text) {
        if (this.$readOnly) {
          return;
        }
        this._emit("paste", text);
        return this.insert(text);
      };

      Editor.prototype.execCommand = function(command, args) {
        return this.commands.exec(command, this, args);
      };

      /*
      		Inserts `text` into wherever the cursor is pointing.
      		@param {String} text The new text to add
      */


      Editor.prototype.insert = function(text) {
        var cursor, end, i, indent, line, lineIndent, lineState, minIndent, mode, outdent, range, row, session, shouldOutdent, size, start, transform;

        session = this.session;
        mode = session.getMode();
        cursor = this.getCursorPosition();
        if (this.getBehavioursEnabled()) {
          transform = mode.transformAction(session.getState(cursor.row), "insertion", this, session, text);
          if (transform) {
            text = transform.text;
          }
        }
        text = text.replace("\t", this.session.getTabString());
        if (!this.selection.isEmpty()) {
          cursor = this.session.remove(this.getSelectionRange());
          this.clearSelection();
        } else if (this.session.getOverwrite()) {
          range = new Range.fromPoints(cursor, cursor);
          range.end.column += text.length;
          this.session.remove(range);
        }
        this.clearSelection();
        start = cursor.column;
        lineState = session.getState(cursor.row);
        line = session.getLine(cursor.row);
        shouldOutdent = mode.checkOutdent(lineState, line, text);
        end = session.insert(cursor, text);
        if (transform && transform.selection) {
          if (transform.selection.length === 2) {
            this.selection.setSelectionRange(new Range(cursor.row, start + transform.selection[0], cursor.row, start + transform.selection[1]));
          } else {
            this.selection.setSelectionRange(new Range(cursor.row + transform.selection[0], transform.selection[1], cursor.row + transform.selection[2], transform.selection[3]));
          }
        }
        if (session.getDocument().isNewLine(text)) {
          lineIndent = mode.getNextLineIndent(lineState, line.slice(0, cursor.column), session.getTabString());
          this.moveCursorTo(cursor.row + 1, 0);
          size = session.getTabSize();
          minIndent = Number.MAX_VALUE;
          row = cursor.row + 1;
          while (row <= end.row) {
            indent = 0;
            line = session.getLine(row);
            i = 0;
            while (i < line.length) {
              if (line.charAt(i) === "\t") {
                indent += size;
              } else if (line.charAt(i) === " ") {
                indent += 1;
              } else {
                break;
              }
              ++i;
            }
            if (/[^\s]/.test(line)) {
              minIndent = Math.min(indent, minIndent);
            }
            ++row;
          }
          row = cursor.row + 1;
          while (row <= end.row) {
            outdent = minIndent;
            line = session.getLine(row);
            i = 0;
            while (i < line.length && outdent > 0) {
              if (line.charAt(i) === "\t") {
                outdent -= size;
              } else {
                if (line.charAt(i) === " ") {
                  outdent -= 1;
                }
              }
              ++i;
            }
            session.remove(new Range(row, 0, row, i));
            ++row;
          }
          session.indentRows(cursor.row + 1, end.row, lineIndent);
        }
        if (shouldOutdent) {
          return mode.autoOutdent(lineState, session, cursor.row);
        }
      };

      Editor.prototype.onTextInput = function(text) {
        return this.keyBinding.onTextInput(text);
      };

      Editor.prototype.onCommandKey = function(e, hashId, keyCode) {
        return this.keyBinding.onCommandKey(e, hashId, keyCode);
      };

      /*
      		Pass in `true` to enable overwrites in your session, or `false` to disable. If overwrites is enabled, any text you enter will type over any text after it. If the value of `overwrite` changes, this function also emites the `changeOverwrite` event.
      		@param {Boolean} overwrite Defines wheter or not to set overwrites
      		
      		
      		@related EditSession.setOverwrite
      */


      Editor.prototype.setOverwrite = function(overwrite) {
        return this.session.setOverwrite(overwrite);
      };

      /*
      		Returns `true` if overwrites are enabled; `false` otherwise.
      		@returns {Boolean}
      		@related EditSession.getOverwrite
      */


      Editor.prototype.getOverwrite = function() {
        return this.session.getOverwrite();
      };

      /*
      		Sets the value of overwrite to the opposite of whatever it currently is.
      		@related EditSession.toggleOverwrite
      */


      Editor.prototype.toggleOverwrite = function() {
        return this.session.toggleOverwrite();
      };

      /*
      		Sets how fast the mouse scrolling should do.
      		@param {Number} speed A value indicating the new speed (in milliseconds)
      */


      Editor.prototype.setScrollSpeed = function(speed) {
        return this.setOption("scrollSpeed", speed);
      };

      /*
      		Returns the value indicating how fast the mouse scroll speed is (in milliseconds).
      		@returns {Number}
      */


      Editor.prototype.getScrollSpeed = function() {
        return this.getOption("scrollSpeed");
      };

      /*
      		Sets the delay (in milliseconds) of the mouse drag.
      		@param {Number} dragDelay A value indicating the new delay
      */


      Editor.prototype.setDragDelay = function(dragDelay) {
        return this.setOption("dragDelay", dragDelay);
      };

      /*
      		Returns the current mouse drag delay.
      		@returns {Number}
      */


      Editor.prototype.getDragDelay = function() {
        return this.getOption("dragDelay");
      };

      /*
      		Emitted when the selection style changes, via [[Editor.setSelectionStyle]].
      		@event changeSelectionStyle
      		@param {Object} data Contains one property, `data`, which indicates the new selection style
      */


      /*
      		Draw selection markers spanning whole line, or only over selected text. Default value is "line"
      		@param {String} style The new selection style "line"|"text"
      */


      Editor.prototype.setSelectionStyle = function(val) {
        return this.setOption("selectionStyle", val);
      };

      /*
      		Returns the current selection style.
      		@returns {String}
      */


      Editor.prototype.getSelectionStyle = function() {
        return this.getOption("selectionStyle");
      };

      /*
      		Determines whether or not the current line should be highlighted.
      		@param {Boolean} shouldHighlight Set to `true` to highlight the current line
      */


      Editor.prototype.setHighlightActiveLine = function(shouldHighlight) {
        return this.setOption("highlightActiveLine", shouldHighlight);
      };

      /*
      		Returns `true` if current lines are always highlighted.
      		@return {Boolean}
      */


      Editor.prototype.getHighlightActiveLine = function() {
        return this.getOption("highlightActiveLine");
      };

      Editor.prototype.setHighlightGutterLine = function(shouldHighlight) {
        return this.setOption("highlightGutterLine", shouldHighlight);
      };

      Editor.prototype.getHighlightGutterLine = function() {
        return this.getOption("highlightGutterLine");
      };

      /*
      		Determines if the currently selected word should be highlighted.
      		@param {Boolean} shouldHighlight Set to `true` to highlight the currently selected word
      */


      Editor.prototype.setHighlightSelectedWord = function(shouldHighlight) {
        return this.setOption("highlightSelectedWord", shouldHighlight);
      };

      /*
      		Returns `true` if currently highlighted words are to be highlighted.
      		@returns {Boolean}
      */


      Editor.prototype.getHighlightSelectedWord = function() {
        return this.$highlightSelectedWord;
      };

      Editor.prototype.setAnimatedScroll = function(shouldAnimate) {
        return this.renderer.setAnimatedScroll(shouldAnimate);
      };

      Editor.prototype.getAnimatedScroll = function() {
        return this.renderer.getAnimatedScroll();
      };

      /*
      		If `showInvisibles` is set to `true`, invisible characters&mdash;like spaces or new lines&mdash;are show in the editor.
      		@param {Boolean} showInvisibles Specifies whether or not to show invisible characters
      */


      Editor.prototype.setShowInvisibles = function(showInvisibles) {
        return this.renderer.setShowInvisibles(showInvisibles);
      };

      /*
      		Returns `true` if invisible characters are being shown.
      		@returns {Boolean}
      */


      Editor.prototype.getShowInvisibles = function() {
        return this.renderer.getShowInvisibles();
      };

      Editor.prototype.setDisplayIndentGuides = function(display) {
        return this.renderer.setDisplayIndentGuides(display);
      };

      Editor.prototype.getDisplayIndentGuides = function() {
        return this.renderer.getDisplayIndentGuides();
      };

      /*
      		If `showPrintMargin` is set to `true`, the print margin is shown in the editor.
      		@param {Boolean} showPrintMargin Specifies whether or not to show the print margin
      */


      Editor.prototype.setShowPrintMargin = function(showPrintMargin) {
        return this.renderer.setShowPrintMargin(showPrintMargin);
      };

      /*
      		Returns `true` if the print margin is being shown.
      		@returns {Boolean}
      */


      Editor.prototype.getShowPrintMargin = function() {
        return this.renderer.getShowPrintMargin();
      };

      /*
      		Sets the column defining where the print margin should be.
      		@param {Number} showPrintMargin Specifies the new print margin
      */


      Editor.prototype.setPrintMarginColumn = function(showPrintMargin) {
        return this.renderer.setPrintMarginColumn(showPrintMargin);
      };

      /*
      		Returns the column number of where the print margin is.
      		@returns {Number}
      */


      Editor.prototype.getPrintMarginColumn = function() {
        return this.renderer.getPrintMarginColumn();
      };

      /*
      		If `readOnly` is true, then the editor is set to read-only mode, and none of the content can change.
      		@param {Boolean} readOnly Specifies whether the editor can be modified or not
      */


      Editor.prototype.setReadOnly = function(readOnly) {
        return this.setOption("readOnly", readOnly);
      };

      /*
      		Returns `true` if the editor is set to read-only mode.
      		@returns {Boolean}
      */


      Editor.prototype.getReadOnly = function() {
        return this.getOption("readOnly");
      };

      /*
      		Specifies whether to use behaviors or not. ["Behaviors" in this case is the auto-pairing of special characters, like quotation marks, parenthesis, or brackets.]{: #BehaviorsDef}
      		@param {Boolean} enabled Enables or disables behaviors
      */


      Editor.prototype.setBehavioursEnabled = function(enabled) {
        return this.setOption("behavioursEnabled", enabled);
      };

      /*
      		Returns `true` if the behaviors are currently enabled. {:BehaviorsDef}
      		
      		@returns {Boolean}
      */


      Editor.prototype.getBehavioursEnabled = function() {
        return this.getOption("behavioursEnabled");
      };

      /*
      		Specifies whether to use wrapping behaviors or not, i.e. automatically wrapping the selection with characters such as brackets
      		when such a character is typed in.
      		@param {Boolean} enabled Enables or disables wrapping behaviors
      */


      Editor.prototype.setWrapBehavioursEnabled = function(enabled) {
        return this.setOption("wrapBehavioursEnabled", enabled);
      };

      /*
      		Returns `true` if the wrapping behaviors are currently enabled.
      */


      Editor.prototype.getWrapBehavioursEnabled = function() {
        return this.getOption("wrapBehavioursEnabled");
      };

      /*
      		Indicates whether the fold widgets should be shown or not.
      		@param {Boolean} show Specifies whether the fold widgets are shown
      */


      Editor.prototype.setShowFoldWidgets = function(show) {
        return this.setOption("showFoldWidgets", show);
      };

      Editor.prototype.getShowFoldWidgets = function() {
        return this.getOption("showFoldWidgets");
      };

      Editor.prototype.setFadeFoldWidgets = function(fade) {
        return this.setOption("fadeFoldWidgets", fade);
      };

      /*
      		Returns `true` if the fold widgets are shown.
      		@return {Boolean}
      */


      Editor.prototype.getFadeFoldWidgets = function() {
        return this.getOption("fadeFoldWidgets");
      };

      /*
      		Removes words of text from the editor. A "word" is defined as a string of characters bookended by whitespace.
      		@param {String} dir The direction of the deletion to occur, either "left" or "right"
      */


      Editor.prototype.remove = function(dir) {
        var new_range, range, session, state;

        if (this.selection.isEmpty()) {
          if (dir === "left") {
            this.selection.selectLeft();
          } else {
            this.selection.selectRight();
          }
        }
        range = this.getSelectionRange();
        if (this.getBehavioursEnabled()) {
          session = this.session;
          state = session.getState(range.start.row);
          new_range = session.getMode().transformAction(state, "deletion", this, session, range);
          if (new_range) {
            range = new_range;
          }
        }
        this.session.remove(range);
        return this.clearSelection();
      };

      /*
      		Removes the word directly to the right of the current selection.
      */


      Editor.prototype.removeWordRight = function() {
        if (this.selection.isEmpty()) {
          this.selection.selectWordRight();
        }
        this.session.remove(this.getSelectionRange());
        return this.clearSelection();
      };

      /*
      		Removes the word directly to the left of the current selection.
      */


      Editor.prototype.removeWordLeft = function() {
        if (this.selection.isEmpty()) {
          this.selection.selectWordLeft();
        }
        this.session.remove(this.getSelectionRange());
        return this.clearSelection();
      };

      /*
      		Removes all the words to the left of the current selection, until the start of the line.
      */


      Editor.prototype.removeToLineStart = function() {
        if (this.selection.isEmpty()) {
          this.selection.selectLineStart();
        }
        this.session.remove(this.getSelectionRange());
        return this.clearSelection();
      };

      /*
      		Removes all the words to the right of the current selection, until the end of the line.
      */


      Editor.prototype.removeToLineEnd = function() {
        var range;

        if (this.selection.isEmpty()) {
          this.selection.selectLineEnd();
        }
        range = this.getSelectionRange();
        if (range.start.column === range.end.column && range.start.row === range.end.row) {
          range.end.column = 0;
          range.end.row++;
        }
        this.session.remove(range);
        return this.clearSelection();
      };

      /*
      		Splits the line at the current selection (by inserting an `'\n'`).
      */


      Editor.prototype.splitLine = function() {
        var cursor;

        if (!this.selection.isEmpty()) {
          this.session.remove(this.getSelectionRange());
          this.clearSelection();
        }
        cursor = this.getCursorPosition();
        this.insert("\n");
        return this.moveCursorToPosition(cursor);
      };

      /*
      		Transposes current line.
      */


      Editor.prototype.transposeLetters = function() {
        var column, cursor, line, range, swap;

        if (!this.selection.isEmpty()) {
          return;
        }
        cursor = this.getCursorPosition();
        column = cursor.column;
        if (column === 0) {
          return;
        }
        line = this.session.getLine(cursor.row);
        swap = void 0;
        range = void 0;
        if (column < line.length) {
          swap = line.charAt(column) + line.charAt(column - 1);
          range = new Range(cursor.row, column - 1, cursor.row, column + 1);
        } else {
          swap = line.charAt(column - 1) + line.charAt(column - 2);
          range = new Range(cursor.row, column - 2, cursor.row, column);
        }
        return this.session.replace(range, swap);
      };

      /*
      		Converts the current selection entirely into lowercase.
      */


      Editor.prototype.toLowerCase = function() {
        var originalRange, range, text;

        originalRange = this.getSelectionRange();
        if (this.selection.isEmpty()) {
          this.selection.selectWord();
        }
        range = this.getSelectionRange();
        text = this.session.getTextRange(range);
        this.session.replace(range, text.toLowerCase());
        return this.selection.setSelectionRange(originalRange);
      };

      /*
      		Converts the current selection entirely into uppercase.
      */


      Editor.prototype.toUpperCase = function() {
        var originalRange, range, text;

        originalRange = this.getSelectionRange();
        if (this.selection.isEmpty()) {
          this.selection.selectWord();
        }
        range = this.getSelectionRange();
        text = this.session.getTextRange(range);
        this.session.replace(range, text.toUpperCase());
        return this.selection.setSelectionRange(originalRange);
      };

      /*
      		Inserts an indentation into the current cursor position or indents the selected lines.
      		
      		@related EditSession.indentRows
      */


      Editor.prototype.indent = function() {
        var column, count, indentString, position, range, rows, session, size;

        session = this.session;
        range = this.getSelectionRange();
        if (range.start.row < range.end.row || range.start.column < range.end.column) {
          rows = this.$getSelectedRows();
          return session.indentRows(rows.first, rows.last, "\t");
        } else {
          indentString = void 0;
          if (this.session.getUseSoftTabs()) {
            size = session.getTabSize();
            position = this.getCursorPosition();
            column = session.documentToScreenColumn(position.row, position.column);
            count = size - column % size;
            indentString = lang.stringRepeat(" ", count);
          } else {
            indentString = "\t";
          }
          return this.insert(indentString);
        }
      };

      /*
      		Indents the current line.
      		@related EditSession.indentRows
      */


      Editor.prototype.blockIndent = function() {
        var rows;

        rows = this.$getSelectedRows();
        return this.session.indentRows(rows.first, rows.last, "\t");
      };

      /*
      		Outdents the current line.
      		@related EditSession.outdentRows
      */


      Editor.prototype.blockOutdent = function() {
        var selection;

        selection = this.session.getSelection();
        return this.session.outdentRows(selection.getRange());
      };

      Editor.prototype.sortLines = function() {
        var deleteRange, i, line, lines, rows, session, _results;

        rows = this.$getSelectedRows();
        session = this.session;
        lines = [];
        i = rows.first;
        while (i <= rows.last) {
          lines.push(session.getLine(i));
          i++;
        }
        lines.sort(function(a, b) {
          if (a.toLowerCase() < b.toLowerCase()) {
            return -1;
          }
          if (a.toLowerCase() > b.toLowerCase()) {
            return 1;
          }
          return 0;
        });
        deleteRange = new Range(0, 0, 0, 0);
        i = rows.first;
        _results = [];
        while (i <= rows.last) {
          line = session.getLine(i);
          deleteRange.start.row = i;
          deleteRange.end.row = i;
          deleteRange.end.column = line.length;
          session.replace(deleteRange, lines[i - rows.first]);
          _results.push(i++);
        }
        return _results;
      };

      /*
      		Given the currently selected range, this function either comments all the lines, or uncomments all of them.
      */


      Editor.prototype.toggleCommentLines = function() {
        var rows, state;

        state = this.session.getState(this.getCursorPosition().row);
        rows = this.$getSelectedRows();
        return this.session.getMode().toggleCommentLines(state, this.session, rows.first, rows.last);
      };

      Editor.prototype.toggleBlockComment = function() {
        var cursor, range, state;

        cursor = this.getCursorPosition();
        state = this.session.getState(cursor.row);
        range = this.getSelectionRange();
        return this.session.getMode().toggleBlockComment(state, this.session, range, cursor);
      };

      /*
      		Works like [[EditSession.getTokenAt]], except it returns a number.
      		@returns {Number}
      */


      Editor.prototype.getNumberAt = function(row, column) {
        var m, number, s, _numberRx;

        _numberRx = /[\-]?[0-9]+(?:\.[0-9]+)?/g;
        _numberRx.lastIndex = 0;
        s = this.session.getLine(row);
        while (_numberRx.lastIndex < column) {
          m = _numberRx.exec(s);
          if (m.index <= column && m.index + m[0].length >= column) {
            number = {
              value: m[0],
              start: m.index,
              end: m.index + m[0].length
            };
            return number;
          }
        }
        return null;
      };

      /*
      		If the character before the cursor is a number, this functions changes its value by `amount`.
      		@param {Number} amount The value to change the numeral by (can be negative to decrease value)
      */


      Editor.prototype.modifyNumber = function(amount) {
        var c, charRange, column, decimals, fp, nnr, nr, replaceRange, row, t;

        row = this.selection.getCursor().row;
        column = this.selection.getCursor().column;
        charRange = new Range(row, column - 1, row, column);
        c = this.session.getTextRange(charRange);
        if (!isNaN(parseFloat(c)) && isFinite(c)) {
          nr = this.getNumberAt(row, column);
          if (nr) {
            fp = (nr.value.indexOf(".") >= 0 ? nr.start + nr.value.indexOf(".") + 1 : nr.end);
            decimals = nr.start + nr.value.length - fp;
            t = parseFloat(nr.value);
            t *= Math.pow(10, decimals);
            if (fp !== nr.end && column < fp) {
              amount *= Math.pow(10, nr.end - column - 1);
            } else {
              amount *= Math.pow(10, nr.end - column);
            }
            t += amount;
            t /= Math.pow(10, decimals);
            nnr = t.toFixed(decimals);
            replaceRange = new Range(row, nr.start, row, nr.end);
            this.session.replace(replaceRange, nnr);
            return this.moveCursorTo(row, Math.max(nr.start + 1, column + nnr.length - nr.value.length));
          }
        }
      };

      Editor.prototype.removeLines = function() {
        var range, rows;

        rows = this.$getSelectedRows();
        range = void 0;
        if (rows.first === 0 || rows.last + 1 < this.session.getLength()) {
          range = new Range(rows.first, 0, rows.last + 1, 0);
        } else {
          range = new Range(rows.first - 1, this.session.getLine(rows.first - 1).length, rows.last, this.session.getLine(rows.last).length);
        }
        this.session.remove(range);
        return this.clearSelection();
      };

      /*
      		Removes all the lines in the current selection
      		@related EditSession.remove
      */


      Editor.prototype.duplicateSelection = function() {
        var doc, endPoint, point, range, reverse, row, sel;

        sel = this.selection;
        doc = this.session;
        range = sel.getRange();
        reverse = sel.isBackwards();
        if (range.isEmpty()) {
          row = range.start.row;
          return doc.duplicateLines(row, row);
        } else {
          point = (reverse ? range.start : range.end);
          endPoint = doc.insert(point, doc.getTextRange(range), false);
          range.start = point;
          range.end = endPoint;
          return sel.setSelectionRange(range, reverse);
        }
      };

      /*
      		Shifts all the selected lines down one row.
      		
      		@returns {Number} On success, it returns -1.
      		@related EditSession.moveLinesUp
      */


      Editor.prototype.moveLinesDown = function() {
        return this.$moveLines(function(firstRow, lastRow) {
          return this.session.moveLinesDown(firstRow, lastRow);
        });
      };

      /*
      		Shifts all the selected lines up one row.
      		@returns {Number} On success, it returns -1.
      		@related EditSession.moveLinesDown
      */


      Editor.prototype.moveLinesUp = function() {
        return this.$moveLines(function(firstRow, lastRow) {
          return this.session.moveLinesUp(firstRow, lastRow);
        });
      };

      /*
      		Moves a range of text from the given range to the given position. `toPosition` is an object that looks like this:
      		```json
      		{ row: newRowLocation, column: newColumnLocation }
      		```
      		@param {Range} fromRange The range of text you want moved within the document
      		@param {Object} toPosition The location (row and column) where you want to move the text to
      		
      		@returns {Range} The new range where the text was moved to.
      		@related EditSession.moveText
      */


      Editor.prototype.moveText = function(range, toPosition) {
        return this.session.moveText(range, toPosition);
      };

      /*
      		Copies all the selected lines up one row.
      		@returns {Number} On success, returns 0.
      */


      Editor.prototype.copyLinesUp = function() {
        return this.$moveLines(function(firstRow, lastRow) {
          this.session.duplicateLines(firstRow, lastRow);
          return 0;
        });
      };

      /*
      		Copies all the selected lines down one row.
      		@returns {Number} On success, returns the number of new rows added; in other words, `lastRow - firstRow + 1`.
      		@related EditSession.duplicateLines
      */


      Editor.prototype.copyLinesDown = function() {
        return this.$moveLines(function(firstRow, lastRow) {
          return this.session.duplicateLines(firstRow, lastRow);
        });
      };

      /*
      		Executes a specific function, which can be anything that manipulates selected lines, such as copying them, duplicating them, or shifting them.
      		@param {Function} mover A method to call on each selected row
      */


      Editor.prototype.$moveLines = function(mover) {
        var first, i, last, linesMoved, range, rangeIndex, ranges, rows, selection;

        selection = this.selection;
        if (!selection.inMultiSelectMode || this.inVirtualSelectionMode) {
          range = selection.toOrientedRange();
          rows = this.$getSelectedRows(range);
          linesMoved = mover.call(this, rows.first, rows.last);
          range.moveBy(linesMoved, 0);
          return selection.fromOrientedRange(range);
        } else {
          ranges = selection.rangeList.ranges;
          selection.rangeList.detach(this.session);
          i = ranges.length;
          while (i--) {
            rangeIndex = i;
            rows = ranges[i].collapseRows();
            last = rows.end.row;
            first = rows.start.row;
            while (i--) {
              rows = ranges[i].collapseRows();
              if (first - rows.end.row <= 1) {
                first = rows.end.row;
              } else {
                break;
              }
            }
            i++;
            linesMoved = mover.call(this, first, last);
            while (rangeIndex >= i) {
              ranges[rangeIndex].moveBy(linesMoved, 0);
              rangeIndex--;
            }
          }
          selection.fromOrientedRange(selection.ranges[0]);
          return selection.rangeList.attach(this.session);
        }
      };

      /*
      		Returns an object indicating the currently selected rows. The object looks like this:
      		
      		```json
      		{ first: range.start.row, last: range.end.row }
      		```
      		
      		@returns {Object}
      */


      Editor.prototype.$getSelectedRows = function() {
        var range;

        range = this.getSelectionRange().collapseRows();
        return {
          first: range.start.row,
          last: range.end.row
        };
      };

      Editor.prototype.onCompositionStart = function(text) {
        return this.renderer.showComposition(this.getCursorPosition());
      };

      Editor.prototype.onCompositionUpdate = function(text) {
        return this.renderer.setCompositionText(text);
      };

      Editor.prototype.onCompositionEnd = function() {
        return this.renderer.hideComposition();
      };

      /*
      		{:VirtualRenderer.getFirstVisibleRow}
      		
      		@returns {Number}
      		@related VirtualRenderer.getFirstVisibleRow
      */


      Editor.prototype.getFirstVisibleRow = function() {
        return this.renderer.getFirstVisibleRow();
      };

      /*
      		{:VirtualRenderer.getLastVisibleRow}
      		
      		@returns {Number}
      		@related VirtualRenderer.getLastVisibleRow
      */


      Editor.prototype.getLastVisibleRow = function() {
        return this.renderer.getLastVisibleRow();
      };

      /*
      		Indicates if the row is currently visible on the screen.
      		@param {Number} row The row to check
      		
      		@returns {Boolean}
      */


      Editor.prototype.isRowVisible = function(row) {
        return row >= this.getFirstVisibleRow() && row <= this.getLastVisibleRow();
      };

      /*
      		Indicates if the entire row is currently visible on the screen.
      		@param {Number} row The row to check
      		
      		
      		@returns {Boolean}
      */


      Editor.prototype.isRowFullyVisible = function(row) {
        return row >= this.renderer.getFirstFullyVisibleRow() && row <= this.renderer.getLastFullyVisibleRow();
      };

      /*
      		Returns the number of currently visibile rows.
      		@returns {Number}
      */


      Editor.prototype.$getVisibleRowCount = function() {
        return this.renderer.getScrollBottomRow() - this.renderer.getScrollTopRow() + 1;
      };

      Editor.prototype.$moveByPage = function(dir, select) {
        var renderer, rows, scrollTop;

        renderer = this.renderer;
        config = this.renderer.layerConfig;
        rows = dir * Math.floor(config.height / config.lineHeight);
        this.$blockScrolling++;
        if (select === true) {
          this.selection.$moveSelection(function() {
            return this.moveCursorBy(rows, 0);
          });
        } else if (select === false) {
          this.selection.moveCursorBy(rows, 0);
          this.selection.clearSelection();
        }
        this.$blockScrolling--;
        scrollTop = renderer.scrollTop;
        renderer.scrollBy(0, rows * config.lineHeight);
        if (select != null) {
          renderer.scrollCursorIntoView(null, 0.5);
        }
        return renderer.animateScrolling(scrollTop);
      };

      /*
      		Selects the text from the current position of the document until where a "page down" finishes.
      */


      Editor.prototype.selectPageDown = function() {
        return this.$moveByPage(1, true);
      };

      /*
      		Selects the text from the current position of the document until where a "page up" finishes.
      */


      Editor.prototype.selectPageUp = function() {
        return this.$moveByPage(-1, true);
      };

      /*
      		Shifts the document to wherever "page down" is, as well as moving the cursor position.
      */


      Editor.prototype.gotoPageDown = function() {
        return this.$moveByPage(1, false);
      };

      /*
      		Shifts the document to wherever "page up" is, as well as moving the cursor position.
      */


      Editor.prototype.gotoPageUp = function() {
        return this.$moveByPage(-1, false);
      };

      /*
      		Scrolls the document to wherever "page down" is, without changing the cursor position.
      */


      Editor.prototype.scrollPageDown = function() {
        return this.$moveByPage(1);
      };

      /*
      		Scrolls the document to wherever "page up" is, without changing the cursor position.
      */


      Editor.prototype.scrollPageUp = function() {
        return this.$moveByPage(-1);
      };

      /*
      		Moves the editor to the specified row.
      		@related VirtualRenderer.scrollToRow
      */


      Editor.prototype.scrollToRow = function(row) {
        return this.renderer.scrollToRow(row);
      };

      /*
      		Scrolls to a line. If `center` is `true`, it puts the line in middle of screen (or attempts to).
      		@param {Number} line The line to scroll to
      		@param {Boolean} center If `true`
      		@param {Boolean} animate If `true` animates scrolling
      		@param {Function} callback Function to be called when the animation has finished
      		
      		
      		@related VirtualRenderer.scrollToLine
      */


      Editor.prototype.scrollToLine = function(line, center, animate, callback) {
        return this.renderer.scrollToLine(line, center, animate, callback);
      };

      /*
      		Attempts to center the current selection on the screen.
      */


      Editor.prototype.centerSelection = function() {
        var pos, range;

        range = this.getSelectionRange();
        pos = {
          row: Math.floor(range.start.row + (range.end.row - range.start.row) / 2),
          column: Math.floor(range.start.column + (range.end.column - range.start.column) / 2)
        };
        return this.renderer.alignCursor(pos, 0.5);
      };

      /*
      		Gets the current position of the cursor.
      		@returns {Object} An object that looks something like this:
      		
      		```json
      		{ row: currRow, column: currCol }
      		```
      		
      		@related Selection.getCursor
      */


      Editor.prototype.getCursorPosition = function() {
        return this.selection.getCursor();
      };

      /*
      		Returns the screen position of the cursor.
      		@returns {Number}
      		@related EditSession.documentToScreenPosition
      */


      Editor.prototype.getCursorPositionScreen = function() {
        return this.session.documentToScreenPosition(this.getCursorPosition());
      };

      /*
      		{:Selection.getRange}
      		@returns {Range}
      		@related Selection.getRange
      */


      Editor.prototype.getSelectionRange = function() {
        return this.selection.getRange();
      };

      /*
      		Selects all the text in editor.
      		@related Selection.selectAll
      */


      Editor.prototype.selectAll = function() {
        this.$blockScrolling += 1;
        this.selection.selectAll();
        return this.$blockScrolling -= 1;
      };

      /*
      		{:Selection.clearSelection}
      		@related Selection.clearSelection
      */


      Editor.prototype.clearSelection = function() {
        return this.selection.clearSelection();
      };

      /*
      		Moves the cursor to the specified row and column. Note that this does not de-select the current selection.
      		@param {Number} row The new row number
      		@param {Number} column The new column number
      		
      		
      		@related Selection.moveCursorTo
      */


      Editor.prototype.moveCursorTo = function(row, column) {
        return this.selection.moveCursorTo(row, column);
      };

      /*
      		Moves the cursor to the position indicated by `pos.row` and `pos.column`.
      		@param {Object} pos An object with two properties, row and column
      		
      		@related Selection.moveCursorToPosition
      */


      Editor.prototype.moveCursorToPosition = function(pos) {
        return this.selection.moveCursorToPosition(pos);
      };

      /*
      		Moves the cursor's row and column to the next matching bracket.
      */


      Editor.prototype.jumpToMatching = function(select) {
        var cursor, pos, range;

        cursor = this.getCursorPosition();
        range = this.session.getBracketRange(cursor);
        if (!range) {
          range = this.find({
            needle: /[{}()\[\]]/g,
            preventScroll: true,
            start: {
              row: cursor.row,
              column: cursor.column - 1
            }
          });
          if (!range) {
            return;
          }
          pos = range.start;
          if (pos.row === cursor.row && Math.abs(pos.column - cursor.column) < 2) {
            range = this.session.getBracketRange(pos);
          }
        }
        pos = range && range.cursor || pos;
        if (pos) {
          if (select) {
            if (range && range.isEqual(this.getSelectionRange())) {
              return this.clearSelection();
            } else {
              return this.selection.selectTo(pos.row, pos.column);
            }
          } else {
            this.clearSelection();
            return this.moveCursorTo(pos.row, pos.column);
          }
        }
      };

      /*
      		Moves the cursor to the specified line number, and also into the indiciated column.
      		@param {Number} lineNumber The line number to go to
      		@param {Number} column A column number to go to
      		@param {Boolean} animate If `true` animates scolling
      */


      Editor.prototype.gotoLine = function(lineNumber, column, animate) {
        this.selection.clearSelection();
        this.session.unfold({
          row: lineNumber - 1,
          column: column || 0
        });
        this.$blockScrolling += 1;
        this.exitMultiSelectMode && this.exitMultiSelectMode();
        this.moveCursorTo(lineNumber - 1, column || 0);
        this.$blockScrolling -= 1;
        if (!this.isRowFullyVisible(lineNumber - 1)) {
          return this.scrollToLine(lineNumber - 1, true, animate);
        }
      };

      /*
      		Moves the cursor to the specified row and column. Note that this does de-select the current selection.
      		@param {Number} row The new row number
      		@param {Number} column The new column number
      		
      		
      		@related Editor.moveCursorTo
      */


      Editor.prototype.navigateTo = function(row, column) {
        this.clearSelection();
        return this.moveCursorTo(row, column);
      };

      /*
      		Moves the cursor up in the document the specified number of times. Note that this does de-select the current selection.
      		@param {Number} times The number of times to change navigation
      */


      Editor.prototype.navigateUp = function(times) {
        var selectionStart;

        if (this.selection.isMultiLine() && !this.selection.isBackwards()) {
          selectionStart = this.selection.anchor.getPosition();
          return this.moveCursorToPosition(selectionStart);
        }
        this.selection.clearSelection();
        times = times || 1;
        return this.selection.moveCursorBy(-times, 0);
      };

      /*
      		Moves the cursor down in the document the specified number of times. Note that this does de-select the current selection.
      		@param {Number} times The number of times to change navigation
      */


      Editor.prototype.navigateDown = function(times) {
        var selectionEnd;

        if (this.selection.isMultiLine() && this.selection.isBackwards()) {
          selectionEnd = this.selection.anchor.getPosition();
          return this.moveCursorToPosition(selectionEnd);
        }
        this.selection.clearSelection();
        times = times || 1;
        return this.selection.moveCursorBy(times, 0);
      };

      /*
      		Moves the cursor left in the document the specified number of times. Note that this does de-select the current selection.
      		@param {Number} times The number of times to change navigation
      */


      Editor.prototype.navigateLeft = function(times) {
        var selectionStart;

        if (!this.selection.isEmpty()) {
          selectionStart = this.getSelectionRange().start;
          this.moveCursorToPosition(selectionStart);
        } else {
          times = times || 1;
          while (times--) {
            this.selection.moveCursorLeft();
          }
        }
        return this.clearSelection();
      };

      /*
      		Moves the cursor right in the document the specified number of times. Note that this does de-select the current selection.
      		@param {Number} times The number of times to change navigation
      */


      Editor.prototype.navigateRight = function(times) {
        var selectionEnd;

        if (!this.selection.isEmpty()) {
          selectionEnd = this.getSelectionRange().end;
          this.moveCursorToPosition(selectionEnd);
        } else {
          times = times || 1;
          while (times--) {
            this.selection.moveCursorRight();
          }
        }
        return this.clearSelection();
      };

      /*
      		Moves the cursor to the start of the current line. Note that this does de-select the current selection.
      */


      Editor.prototype.navigateLineStart = function() {
        this.selection.moveCursorLineStart();
        return this.clearSelection();
      };

      /*
      		Moves the cursor to the end of the current line. Note that this does de-select the current selection.
      */


      Editor.prototype.navigateLineEnd = function() {
        this.selection.moveCursorLineEnd();
        return this.clearSelection();
      };

      /*
      		Moves the cursor to the end of the current file. Note that this does de-select the current selection.
      */


      Editor.prototype.navigateFileEnd = function() {
        var scrollTop;

        scrollTop = this.renderer.scrollTop;
        this.selection.moveCursorFileEnd();
        this.clearSelection();
        return this.renderer.animateScrolling(scrollTop);
      };

      /*
      		Moves the cursor to the start of the current file. Note that this does de-select the current selection.
      */


      Editor.prototype.navigateFileStart = function() {
        var scrollTop;

        scrollTop = this.renderer.scrollTop;
        this.selection.moveCursorFileStart();
        this.clearSelection();
        return this.renderer.animateScrolling(scrollTop);
      };

      /*
      		Moves the cursor to the word immediately to the right of the current position. Note that this does de-select the current selection.
      */


      Editor.prototype.navigateWordRight = function() {
        this.selection.moveCursorWordRight();
        return this.clearSelection();
      };

      /*
      		Moves the cursor to the word immediately to the left of the current position. Note that this does de-select the current selection.
      */


      Editor.prototype.navigateWordLeft = function() {
        this.selection.moveCursorWordLeft();
        return this.clearSelection();
      };

      /*
      		Replaces the first occurance of `options.needle` with the value in `replacement`.
      		@param {String} replacement The text to replace with
      		@param {Object} options The [[Search `Search`]] options to use
      */


      Editor.prototype.replace = function(replacement, options) {
        var range, replaced;

        if (options) {
          this.$search.set(options);
        }
        range = this.$search.find(this.session);
        replaced = 0;
        if (!range) {
          return replaced;
        }
        if (this.$tryReplace(range, replacement)) {
          replaced = 1;
        }
        if (range !== null) {
          this.selection.setSelectionRange(range);
          this.renderer.scrollSelectionIntoView(range.start, range.end);
        }
        return replaced;
      };

      /*
      		Replaces all occurances of `options.needle` with the value in `replacement`.
      		@param {String} replacement The text to replace with
      		@param {Object} options The [[Search `Search`]] options to use
      */


      Editor.prototype.replaceAll = function(replacement, options) {
        var i, ranges, replaced, selection;

        if (options) {
          this.$search.set(options);
        }
        ranges = this.$search.findAll(this.session);
        replaced = 0;
        if (!ranges.length) {
          return replaced;
        }
        this.$blockScrolling += 1;
        selection = this.getSelectionRange();
        this.clearSelection();
        this.selection.moveCursorTo(0, 0);
        i = ranges.length - 1;
        while (i >= 0) {
          if (this.$tryReplace(ranges[i], replacement)) {
            replaced++;
          }
          --i;
        }
        this.selection.setSelectionRange(selection);
        this.$blockScrolling -= 1;
        return replaced;
      };

      Editor.prototype.$tryReplace = function(range, replacement) {
        var input;

        input = this.session.getTextRange(range);
        replacement = this.$search.replace(input, replacement);
        if (replacement !== null) {
          range.end = this.session.replace(range, replacement);
          return range;
        } else {
          return null;
        }
      };

      /*
      		{:Search.getOptions} For more information on `options`, see [[Search `Search`]].
      		@related Search.getOptions
      		@returns {Object}
      */


      Editor.prototype.getLastSearchOptions = function() {
        return this.$search.getOptions();
      };

      /*
      		Attempts to find `needle` within the document. For more information on `options`, see [[Search `Search`]].
      		@param {String} needle The text to search for (optional)
      		@param {Object} options An object defining various search properties
      		@param {Boolean} animate If `true` animate scrolling
      		
      		
      		@related Search.find
      */


      Editor.prototype.find = function(needle, options, animate) {
        var newRange, range;

        if (!options) {
          options = {};
        }
        if (typeof needle === "string" || needle instanceof RegExp) {
          options.needle = needle;
        } else {
          if (typeof needle === "object") {
            oop.mixin(options, needle);
          }
        }
        range = this.selection.getRange();
        if (options.needle == null) {
          needle = this.session.getTextRange(range) || this.$search.$options.needle;
          if (!needle) {
            range = this.session.getWordRange(range.start.row, range.start.column);
            needle = this.session.getTextRange(range);
          }
          this.$search.set({
            needle: needle
          });
        }
        this.$search.set(options);
        if (!options.start) {
          this.$search.set({
            start: range
          });
        }
        newRange = this.$search.find(this.session);
        if (options.preventScroll) {
          return newRange;
        }
        if (newRange) {
          this.revealRange(newRange, animate);
          return newRange;
        }
        if (options.backwards) {
          range.start = range.end;
        } else {
          range.end = range.start;
        }
        return this.selection.setRange(range);
      };

      /*
      		Performs another search for `needle` in the document. For more information on `options`, see [[Search `Search`]].
      		@param {Object} options search options
      		@param {Boolean} animate If `true` animate scrolling
      		
      		
      		@related Editor.find
      */


      Editor.prototype.findNext = function(options, animate) {
        return this.find({
          skipCurrent: true,
          backwards: false
        }, options, animate);
      };

      /*
      		Performs a search for `needle` backwards. For more information on `options`, see [[Search `Search`]].
      		@param {Object} options search options
      		@param {Boolean} animate If `true` animate scrolling
      		
      		
      		@related Editor.find
      */


      Editor.prototype.findPrevious = function(options, animate) {
        return this.find(options, {
          skipCurrent: true,
          backwards: true
        }, animate);
      };

      Editor.prototype.revealRange = function(range, animate) {
        var scrollTop;

        this.$blockScrolling += 1;
        this.session.unfold(range);
        this.selection.setSelectionRange(range);
        this.$blockScrolling -= 1;
        scrollTop = this.renderer.scrollTop;
        this.renderer.scrollSelectionIntoView(range.start, range.end, 0.5);
        if (animate !== false) {
          return this.renderer.animateScrolling(scrollTop);
        }
      };

      /*
      		{:UndoManager.undo}
      		@related UndoManager.undo
      */


      Editor.prototype.undo = function() {
        this.$blockScrolling++;
        this.session.getUndoManager().undo();
        this.$blockScrolling--;
        return this.renderer.scrollCursorIntoView(null, 0.5);
      };

      /*
      		{:UndoManager.redo}
      		@related UndoManager.redo
      */


      Editor.prototype.redo = function() {
        this.$blockScrolling++;
        this.session.getUndoManager().redo();
        this.$blockScrolling--;
        return this.renderer.scrollCursorIntoView(null, 0.5);
      };

      /*
      		Cleans up the entire editor.
      */


      Editor.prototype.destroy = function() {
        this.renderer.destroy();
        return this._emit("destroy", this);
      };

      /*
      		Enables automatic scrolling of the cursor into view when editor itself is inside scrollable element
      		@param {Boolean} enable default true
      */


      Editor.prototype.setAutoScrollEditorIntoView = function(enable) {
        var onAfterRender, onBeforeRender, onChangeSelection, rect, scrollAnchor, self, shouldScroll;

        if (enable === false) {
          return;
        }
        rect = void 0;
        self = this;
        shouldScroll = false;
        if (!this.$scrollAnchor) {
          this.$scrollAnchor = document.createElement("div");
        }
        scrollAnchor = this.$scrollAnchor;
        scrollAnchor.style.cssText = "position:absolute";
        this.container.insertBefore(scrollAnchor, this.container.firstChild);
        onChangeSelection = this.on("changeSelection", function() {
          return shouldScroll = true;
        });
        onBeforeRender = this.renderer.on("beforeRender", function() {
          if (shouldScroll) {
            return rect = self.renderer.container.getBoundingClientRect();
          }
        });
        onAfterRender = this.renderer.on("afterRender", function() {
          var pos, renderer, top;

          if (shouldScroll && rect && self.isFocused()) {
            renderer = self.renderer;
            pos = renderer.$cursorLayer.$pixelPos;
            config = renderer.layerConfig;
            top = pos.top - config.offset;
            if (pos.top >= 0 && top + rect.top < 0) {
              shouldScroll = true;
            } else if (pos.top < config.height && pos.top + rect.top + config.lineHeight > window.innerHeight) {
              shouldScroll = false;
            } else {
              shouldScroll = null;
            }
            if (shouldScroll != null) {
              scrollAnchor.style.top = top + "px";
              scrollAnchor.style.left = pos.left + "px";
              scrollAnchor.style.height = config.lineHeight + "px";
              scrollAnchor.scrollIntoView(shouldScroll);
            }
            return shouldScroll = rect = null;
          }
        });
        return {
          setAutoScrollEditorIntoView: function(enable) {
            if (enable === true) {
              return;
            }
            delete this.setAutoScrollEditorIntoView;
            this.removeEventListener("changeSelection", onChangeSelection);
            this.renderer.removeEventListener("afterRender", onAfterRender);
            return this.renderer.removeEventListener("beforeRender", onBeforeRender);
          }
        };
      };

      Editor.prototype.$resetCursorStyle = function() {
        var cursorLayer, style;

        style = this.$cursorStyle || "ace";
        cursorLayer = this.renderer.$cursorLayer;
        if (!cursorLayer) {
          return;
        }
        cursorLayer.setSmoothBlinking(style === "smooth");
        return cursorLayer.isBlinking = !this.$readOnly && style !== "wide";
      };

      return Editor;

    })(EventEmitter);
    config.defineOptions(Editor.prototype, "editor", {
      selectionStyle: {
        set: function(style) {
          this.onSelectionChange();
          return this._emit("changeSelectionStyle", {
            data: style
          });
        },
        initialValue: "line"
      },
      highlightActiveLine: {
        set: function() {
          return this.$updateHighlightActiveLine();
        },
        initialValue: true
      },
      highlightSelectedWord: {
        set: function(shouldHighlight) {
          return this.$onSelectionChange();
        },
        initialValue: true
      },
      readOnly: {
        set: function(readOnly) {
          return this.$resetCursorStyle();
        },
        initialValue: false
      },
      cursorStyle: {
        set: function(val) {
          return this.$resetCursorStyle();
        },
        values: ["ace", "slim", "smooth", "wide"],
        initialValue: "ace"
      },
      behavioursEnabled: {
        initialValue: true
      },
      wrapBehavioursEnabled: {
        initialValue: true
      },
      hScrollBarAlwaysVisible: "renderer",
      highlightGutterLine: "renderer",
      animatedScroll: "renderer",
      showInvisibles: "renderer",
      showPrintMargin: "renderer",
      printMarginColumn: "renderer",
      printMargin: "renderer",
      fadeFoldWidgets: "renderer",
      showFoldWidgets: "renderer",
      showGutter: "renderer",
      displayIndentGuides: "renderer",
      fontSize: "renderer",
      fontFamily: "renderer",
      scrollSpeed: "$mouseHandler",
      dragDelay: "$mouseHandler",
      focusTimout: "$mouseHandler",
      firstLineNumber: "session",
      overwrite: "session",
      newLineMode: "session",
      useWorker: "session",
      useSoftTabs: "session",
      tabSize: "session",
      wrap: "session",
      foldStyle: "session"
    });
    return Editor;
  });

}).call(this);
