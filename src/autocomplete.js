;(function (exports) {
  "use strict";

  // accessor for the data. If the given data is an array of json object, value
  // can be: function(val) { return val.x; }
  var value;

  // what is displayed in the list of suggestion. Default to value
  var display;

  // function to update the dom list of suggestion
  var updateSuggestions;
  var hideSuggestions;
  var removeWidget;

  // some utility functions
  var insertAfter = function(referenceNode, newNode) {
    if(referenceNode.nextSibling){
      referenceNode.parentElement.insertBefore(newNode, referenceNode.nextSibling);
    } else {
      referenceNode.parentElement.appendChild(newNode);
    }
  };


  exports.Autocomplete = function(el, data, opts) {
    opts = opts || {};

    // controll the verbosity
    if(opts.verbose === void(0)) opts.verbose = true;
    var warn = function() {
      if(opts.verbose) console.warn.apply(console, arguments);
    };
    var log = function() {
      if(opts.verbose) console.log.apply(console, arguments);
    };


    if(typeof el === 'string'){
      // reference to the dom, get the real node
      el = document.querySelector(el);
    }

    if(el === void(0) || el === null) {
      throw new Error("You must pass an input element at creation. Eg: new Autocomplete(document.querySelector('input#target'))");
    }

    if(data === void(0) || data === null) {
      throw new Error("No data passed. Try something like: new Autocomplete(el, myData)");
    }

    if(Object.prototype.toString.call(data) !== "[object Array]") {
      throw new Error("The data should be an array, but got "+ Object.prototype.toString.call(data));
    }

    if(el.getAttribute("autocomplete") === null) {
      el.setAttribute("autocomplete", '');
      el.addEventListener("removeAutocomplete", function() {
        log("remove the widget here");
      });
    } else {
      warn("Autocomplete widget already created for this element, removing the previous version.");
      removeWidget(el);
    }

    removeWidget = function(el) {
      el.removeAttribute("autocomplete");
      ["change", "input", "paste"].forEach(function(evt) {
        el.removeEventListener(evt, updateSuggestions);
      });
      el.removeEventListener("removeAutocomplete");
      el.removeEventListener("focusout", hideSuggestions);
    };

    opts = opts || {};

    //default accessor
    value = opts.value || function(x) { return x; };

    display = opts.display || value;

    var displayLimit = opts.displayLimit || 5;

    this._data = data;
    this.el = el;

    var list = document.createElement('ul');
    list.classList.add('completion');
    list.style.display = "none"; //don't display it yet
    insertAfter(el, list);

    updateSuggestions = function(widget) {
      var lastInput = null;
      return function() {
        var val = widget.el.value;
        var emphasize = new RegExp("("+val+")", 'i');
        list.style.display = 'block';
        list.style.opacity = 1;

        if(lastInput === el.value) {
          return;
        }
        lastInput = el.value;
        var filteredData = widget._getFilteredData();
        var toDisplay = filteredData.slice(0, displayLimit);

        list.innerHTML = '';
        // populate the list
        toDisplay.forEach(function(datum) {
          var item = document.createElement('li');
          item.innerHTML = display(datum, val);
          list.appendChild(item);
        });
        if(filteredData.length > displayLimit) {
          var more = document.createElement('li');
          more.classList.add('more');
          more.innerHTML = 'and more...';
          list.appendChild(more);
        }
      };
    }(this);

    // add the required listeners to trigger the update of suggestions.
    ["focusin", "change", "keyup", "paste"].forEach(function(evt) {
      el.addEventListener(evt, updateSuggestions);
    });

    hideSuggestions = function(){list.style.opacity=0;};
    el.addEventListener("focusout", hideSuggestions);

    return this;
  };

  // from the content of the input element, return a subset (eventually empty)
  // of the original data where each element matches the content with respect
  // to the 'value' accessor.
  Autocomplete.prototype._getFilteredData = function() {
    var text = this.el.value;
    if(!text) return [];

    var regexp = new RegExp(text, 'gi');
    return this._data.filter(function(val) {
      return regexp.test(value(val));
    });
  };



})(this);



