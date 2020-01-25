export default () => {
  var events = {};
  var api = {};

  function addEvent(name, func, wrapped) {
    var evName = name.toLowerCase();
    events[evName] = events[evName] || [];

    events[evName].push({
      func: func,
      wrapped: wrapped
    });

    return api;
  }

  function removeEvent(name, func) {
    events[name] = events[name].filter(function (obj) {
      return obj.func !== func;
    });

    return api;
  }

  api.on = function on(name, func) {
    return addEvent(name, func, func);
  };

  api.once = function once(name, func) {
    return addEvent(name, func, function onceWrapper() {
      func.apply(null, [].slice.call(arguments));
      removeEvent(name, func);
    });
  };

  api.off = function off(name, func) {
    var evName = name.toLowerCase();

    if (!events[evName]) {
      return api;
    }

    return removeEvent(evName, func);
  };

  api.emit = function emit(name) {
    var evName = name.toLowerCase();
    var args = arguments;

    if (!events[evName]) {
      return api;
    }

    events[evName].forEach(function(obj){
      obj.wrapped.apply(null, [].slice.call(args, 1));
    });
  };

  return api;
};
