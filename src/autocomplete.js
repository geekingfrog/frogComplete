;(function (exports) {
  "use strict";

  // function to update the dom list of suggestion
  var updateSuggestions;
  var updateEvents = ["focus", "change", "paste", "input"];
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
    widget.isInputValid = false;
    widget.selectedDatum = null;

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
      el.addEventListener("removeAutocomplete", function() { removeWidget(el); });
    } else {
      warn("Autocomplete widget already created for this element, removing the previous version.");
      removeWidget(el);
    }

    removeWidget = function(el) {
      el.removeAttribute("autocomplete");
      updateEvents.forEach(function(evt) {
        el.removeEventListener(evt, updateSuggestions);
      });
      el.removeEventListener("removeAutocomplete");
      el.removeEventListener("blur", hideSuggestions);
      if(list && list.parentNode) { list.parentNode.removeChild(list); }
    };

    opts = opts || {};

    var displayLimit = opts.displayLimit || 5;

    widget.data = data;
    widget.el = el;

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
      widget.isInputValid = true;
      widget.selectedDatum = datum;
      list.classList.add('hide');
    };
    list.addEventListener("click", selectSuggestion, false);

    // Dom element to display a warning message
    var warnItem = document.createElement('div');
    warnItem.classList.add('autocomplete-error');
    warnItem.classList.add('hide');
    warnItem.textContent = "Invalid input, you must chose from the list.";
    insertAfter(widget.el, warnItem);

    // debounce this function later if performance becomes a problem.
    updateSuggestions = function(widget) {
      var lastInput = null;
      return function(ev) {
        var val = widget.el.value;
        var emphasize = new RegExp("("+val+")", 'i');

        // input is deemed invalid if it has changed
        if(widget.selectedDatum && val && val !== widget.selectedDatum) {
          widget.isInputValid = false;
          widget.selectedDatum = null;
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
      el.addEventListener(evt, updateSuggestions);
    });


    // Do not hide the suggestion list if the mouse is over it
    var isMouseOverList = false;
    list.addEventListener('mouseover', function() {
      isMouseOverList = true;
    });
    list.addEventListener('mouseout', function() {
      isMouseOverList = false;
    });

    hideSuggestions = function(){
      if(!isMouseOverList) {
        list.classList.add('hide');
      }
    };
    el.addEventListener("blur", hideSuggestions);


    // validation part
    var validateTarget = null;
    var validateTrigger = opts.validateTrigger || 'submit';

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
      validateTarget.addEventListener(validateTrigger, function(ev) {
        if(!widget.isInputValid) {
          log("form invalid !");
          ev.preventDefault();
          ev.stopPropagation();
          widget.isInputValid = false;

          list.innerHTML = '';

          warnItem.classList.remove('hide');
          return false;
        } else {
          widget.isInputValid = true;
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
    return this.data.filter(function(val) {
      return regexp.test(that.value(val));
    });
  };


})(this);
