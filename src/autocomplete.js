;(function (exports) {
  "use strict";

  // function to update the dom list of suggestion
  var updateEvents = ["focus", "change", "paste", "input"];

  // some utility functions
  var insertAfter = function(referenceNode, newNode) {
    if(referenceNode.nextSibling){
      referenceNode.parentElement.insertBefore(newNode, referenceNode.nextSibling);
    } else {
      referenceNode.parentElement.appendChild(newNode);
    }
  };

  // because phantomJS doesn't have the Event constuctor
  var createEvent = function(name) {
    if(typeof Event === 'function'){
      return new Event(name);
    } else {
      var evt = document.createEvent('CustomEvent'); // MUST be 'CustomEvent'
      evt.initCustomEvent(name, true, false, null);
      return evt;
    }
  };

  exports.Autocomplete = function(el, data, opts) {
    var widget = this;
    opts = opts || {};
 
    // accessor for the data. If the given data is an array of json object, value
    // can be: function(val) { return val.x; }
    widget.value = opts.value || function(x) { return x; };

    // what is displayed in the list of suggestion. Default to value with
    // matching part emphasized
    widget.display = opts.display || function(d, input) {
      var emphasize = new RegExp("("+input+")",'i');
      return widget.value(d).replace(emphasize, "<strong>$1</strong>");
    };

    // for validation
    widget._isInputValid = false;
    widget._selectedDatum = null;

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

    widget.el = el;

    if(Object.prototype.toString.call(data) !== "[object Array]") {
      throw new Error("The data should be an array, but got "+ Object.prototype.toString.call(data));
    }

    widget._data = data;
    var displayLimit = opts.displayLimit || 5;

    widget._getAutocomplete = function(ev) {
      if(ev.detail && typeof ev.detail === 'function') {
        ev.detail(widget);
      }
    };

    var that = this;
    if(el.getAttribute("autocomplete") === null) {
      el.setAttribute("autocomplete", '');
      el.addEventListener("getAutocomplete", widget._getAutocomplete);
    } else {
      throw new Error('widgetAlreadyHere');
    }



    // object used to map a data to a dom node.
    // It is used with the suggestion list, where each item
    // is associated with one datum, but since these data can be arbitrary,
    // they cannot (and shouldn't) be serialized in the DOM
    var internalStore = {};
    widget.internalStore = internalStore;


    var list = document.createElement('ul');
    list.classList.add('suggestion');
    list.classList.add('fade');
    list.classList.add('hide'); //don't display it yet
    insertAfter(el, list);
    widget._list = list;

    // copy the value(datum) to the input field
    var selectSuggestion = function(ev) {
      ev.stopPropagation();

      // If the displayed content is inside a tag, then ev.target is this
      // tag and not the expected <li>
      // So, look for the first parent which has the dataId attribute.
      var item = ev.target;
      while(item && item.getAttribute('dataId') === null) {
        item = item.parentElement;
      }

      var dataId = item.getAttribute('dataId');
      var datum = internalStore[dataId];
      el.value = widget.value(datum);
      widget._isInputValid = true;
      widget._selectedDatum = datum;
      list.classList.add('hide');
    };
    list.addEventListener("click", selectSuggestion, false);

    // Dom element to display a warning message
    var warnItem = document.createElement('div');
    warnItem.classList.add('autocomplete-error');
    warnItem.classList.add('hide');
    warnItem.textContent = "Invalid input, you must chose from the list.";
    insertAfter(widget.el, warnItem);
    widget._warnItem = warnItem;

    // debounce this function later if performance becomes a problem.
    widget._updateSuggestions = function(widget) {
      var lastInput = null;
      return function(ev) {
        var val = widget.el.value;
        var emphasize = new RegExp("("+val+")", 'i');

        // input is deemed invalid if it has changed
        if(widget._selectedDatum && val && val !== widget._selectedDatum) {
          widget._isInputValid = false;
          widget._selectedDatum = null;
        }

        list.classList.remove('hide');
        
        // always recompute and display the list of suggestion if
        // the error message is visible.
        var errorDisplayed = !warnItem.classList.contains('hide');
        if(lastInput === el.value && !errorDisplayed) { return; }

        warnItem.classList.add('hide');
        
        lastInput = el.value;
        var filteredData = widget.getFilteredData();
        var toDisplay = filteredData.slice(0, displayLimit);

        list.innerHTML = '';

        // populate the list
        internalStore = {};
        toDisplay.forEach(function(datum, index) {
          var item = document.createElement('li');
          item.innerHTML = widget.display(datum, val);
          item.setAttribute('dataId', index);
          internalStore[index] = datum;
          list.appendChild(item);
        });
        if(filteredData.length >= displayLimit) {
          var more = document.createElement('li');
          more.classList.add('more');
          more.textContent = "And more...";
          list.appendChild(more);
        }
        if(filteredData.length === 0) { list.classList.add('hide'); }

      };
    }(this);


    // add the required listeners to trigger the update of suggestions.
    updateEvents.forEach(function(evt) {
      el.addEventListener(evt, widget._updateSuggestions);
    });


    // Do not hide the suggestion list if the mouse is over it
    var isMouseOverList = false;
    list.addEventListener('mouseover', function() {
      isMouseOverList = true;
    });
    list.addEventListener('mouseout', function() {
      isMouseOverList = false;
    });

    widget._hideSuggestions = function(){
      if(!isMouseOverList) {
        list.classList.add('hide');
      }
    };
    el.addEventListener("blur", widget._hideSuggestions);


    // validation part
    var validateTarget = null;
    widget._validateTrigger = opts.validateTrigger || 'submit';

    if(opts.validation === true) {
      // the input should be in a form, so the event to block is the 'submit'
      var currentNode = el;
      while(validateTarget === null && currentNode !== null) {
        if(currentNode.nodeName === 'FORM') {
          validateTarget = currentNode;
        } else {
          currentNode = currentNode.parentElement;
        }
      }
    } else if(typeof opts.validation === 'string') {
      validateTarget = document.querySelector(opts.validation);
      if(!validateTarget) {
        warn("No element found for selector: "+opts.validation+" ! Validation disabled");
      }
    } else if(opts.validation && opts.validation.nodeType === 1) {
      // nodeType === 1 <-> Element_node
      validateTarget = opts.validation;
    }

    if(validateTarget) {
      validateTarget.addEventListener(widget._validateTrigger, function(ev) {
        if(!widget._isInputValid) {
          log("form invalid !");
          ev.preventDefault();
          ev.stopPropagation();
          widget._isInputValid = false;

          list.innerHTML = '';

          warnItem.classList.remove('hide');
          return false;
        } else {
          widget._isInputValid = true;
        }
      });
    }

    return widget;
  };


  // from the content of the input element, return a subset (eventually empty)
  // of the original data where each element matches the content with respect
  // to the 'value' accessor.
  Autocomplete.prototype.getFilteredData = function() {
    var text = this.el.value;
    if(!text) return [];

    text = text.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");

    // do not use the 'g' flag in the regexp here.
    // if the global flag is used, then the index of the regex should be resetted
    // before testing for a new string:
    // regexp.lastIndex=0;
    var regexp = new RegExp(text, 'i');
    var that = this;
    return this._data.filter(function(val) {
      return regexp.test(that.value(val));
    });
  };

  Autocomplete.prototype.remove = function(){
    var widget = this;
    widget.el.removeAttribute("autocomplete");
    updateEvents.forEach(function(evt) {
      widget.el.removeEventListener(evt, widget._updateSuggestions);
    });
    widget.el.removeEventListener("blur", widget._hideSuggestions);
    widget.el.removeEventListener("getAutocomplete", widget._getAutocomplete);
    widget.el.removeEventListener(widget._validateTrigger);
    if(widget._list && widget._list.parentNode) {
      widget._list.parentNode.removeChild(widget._list);
    }
    if(widget._warnItem && widget._warnItem.parentNode) {
      widget._warnItem.parentNode.removeChild(widget._warnItem);
    }
    return true;
  };

  Autocomplete.prototype.getData = function() {
    return this._data;
  };

  Autocomplete.prototype.isInputValid = function() {
    return this._isInputValid;
  };

  Autocomplete.prototype.getSelectedDatum = function() {
    return this._selectedDatum;
  };


})(this);
