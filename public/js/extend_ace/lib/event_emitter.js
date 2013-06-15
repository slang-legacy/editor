(function() {
  define([], function() {
    var EventEmitter, preventDefault, stopPropagation;
    stopPropagation = function() {
      return this.propagationStopped = true;
    };
    preventDefault = function() {
      return this.defaultPrevented = true;
    };
    EventEmitter = (function() {
      function EventEmitter() {
        this._dispatchEvent = this._emit;
        this.addEventListener = this.on;
        this.removeListener = this.removeEventListener = this.off;
      }

      EventEmitter.prototype._emit = function(eventName, e) {
        var defaultHandler, i, listeners;
        this._eventRegistry || (this._eventRegistry = {});
        this._defaultHandlers || (this._defaultHandlers = {});
        listeners = this._eventRegistry[eventName] || [];
        defaultHandler = this._defaultHandlers[eventName];
        if (!listeners.length && !defaultHandler) {
          return;
        }
        if (typeof e !== "object" || !e) {
          e = {};
        }
        if (!e.type) {
          e.type = eventName;
        }
        if (!e.stopPropagation) {
          e.stopPropagation = stopPropagation;
        }
        if (!e.preventDefault) {
          e.preventDefault = preventDefault;
        }
        i = 0;
        while (i < listeners.length) {
          listeners[i](e, this);
          if (e.propagationStopped) {
            break;
          }
          i++;
        }
        if (defaultHandler && !e.defaultPrevented) {
          return defaultHandler(e, this);
        }
      };

      EventEmitter.prototype._signal = function(eventName, e) {
        var i, listeners, _results;
        listeners = (this._eventRegistry || {})[eventName];
        if (!listeners) {
          return;
        }
        i = 0;
        _results = [];
        while (i < listeners.length) {
          listeners[i](e, this);
          _results.push(i++);
        }
        return _results;
      };

      EventEmitter.prototype.once = function(eventName, callback) {
        var newCallback, _self;
        _self = this;
        return callback && this.addEventListener(eventName, newCallback = function() {
          _self.removeEventListener(eventName, newCallback);
          return callback.apply(null, arguments_);
        });
      };

      EventEmitter.prototype.setDefaultHandler = function(eventName, callback) {
        var disabled, handlers, i, old;
        handlers = this._defaultHandlers;
        if (!handlers) {
          handlers = this._defaultHandlers = {
            _disabled_: {}
          };
        }
        if (handlers[eventName]) {
          old = handlers[eventName];
          disabled = handlers._disabled_[eventName];
          if (!disabled) {
            handlers._disabled_[eventName] = disabled = [];
          }
          disabled.push(old);
          i = disabled.indexOf(callback);
          if (i !== -1) {
            disabled.splice(i, 1);
          }
        }
        return handlers[eventName] = callback;
      };

      EventEmitter.prototype.removeDefaultHandler = function(eventName, callback) {
        var disabled, handlers, i, old;
        handlers = this._defaultHandlers;
        if (!handlers) {
          return;
        }
        disabled = handlers._disabled_[eventName];
        if (handlers[eventName] === callback) {
          old = handlers[eventName];
          if (disabled) {
            return this.setDefaultHandler(eventName, disabled.pop());
          }
        } else if (disabled) {
          i = disabled.indexOf(callback);
          if (i !== -1) {
            return disabled.splice(i, 1);
          }
        }
      };

      EventEmitter.prototype.on = function(eventName, callback, capturing) {
        var listeners;
        this._eventRegistry = this._eventRegistry || {};
        listeners = this._eventRegistry[eventName];
        if (!listeners) {
          listeners = this._eventRegistry[eventName] = [];
        }
        if (listeners.indexOf(callback) === -1) {
          listeners[(capturing ? "unshift" : "push")](callback);
        }
        return callback;
      };

      EventEmitter.prototype.off = function(eventName, callback) {
        var index, listeners;
        this._eventRegistry = this._eventRegistry || {};
        listeners = this._eventRegistry[eventName];
        if (!listeners) {
          return;
        }
        index = listeners.indexOf(callback);
        if (index !== -1) {
          return listeners.splice(index, 1);
        }
      };

      EventEmitter.prototype.removeAllListeners = function(eventName) {
        if (this._eventRegistry) {
          return this._eventRegistry[eventName] = [];
        }
      };

      return EventEmitter;

    })();
    return EventEmitter;
  });

}).call(this);
