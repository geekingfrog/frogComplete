
// change this if you want more logs on the automated tests
var globalOpts = {verbose: false};

// polyfill for new Event() in phantomJS, see
// https://github.com/ariya/phantomjs/issues/11289
var createEvent = function(name, data) {
  var evt = document.createEvent('CustomEvent'); // MUST be 'CustomEvent'
  evt.initCustomEvent(name, true, false,  data);
  return evt;
};

// form.submit() doesn't trigger the 'submit' handlers, and so bypass any
// validation. So to test that, I manually trigger the event 'submit'.
// This is a hack and a limitation of my approach. I don't know if there
// is any workaround for this.
var submitForm = function(form) {
  form.dispatchEvent(createEvent('submit'));
};


// utility
var simulateInput = function(el, input) {
  el.value = input;
  el.dispatchEvent(createEvent('change'));
};

module("Creation and destruction", {
  setup: function(){
    this.target = 'input#target';
  },
  teardown: function() {
    if(this.widget) { this.widget.remove(); }
    ok(!document.querySelector('input#target[autocomplete]'), "ok");
  }
});

test("Invalid target element", function() {
  throws(function(){new Autocomplete(null, null, globalOpts);}, "Cannot create the widget without a target");
  throws(function(){new Autocomplete('doesntexist', null, globalOpts);}, "Cannot create the widget with an invalid dom selector");
});

test("Valid target selector", function() {
  this.widget = new Autocomplete(this.target, [], globalOpts);
  ok(this.widget, "Can pass a valid selector");
});


test("Destruction with prototype", function() {
  var auto = new Autocomplete(this.target, [], globalOpts);
  ok(auto , "Sanity test, ");
  ok(document.querySelector('ul.frogcomplete-suggestion'), "List of suggestion added to the dom");
  ok(document.querySelector('.frogcomplete-error'), "Placeholder for error message is here");
  auto.remove();
  equal(document.querySelector('ul.frogcomplete-suggestion'), null, "Suggestion list removed");
  equal(document.querySelector('.frogcomplete-error'), null, "Warning message removed");
  equal(document.querySelector('input[autocomplete]'), null, "No widget created");
});

test("Valid DOM element", function(){
  var domTarget = document.querySelector(this.target);
  this.widget = new Autocomplete(domTarget, [], globalOpts);
  ok(this.widget, "Can also directly pass the dom node");
  domTarget.dispatchEvent(createEvent('removeAutocomplete'));
});

test("No data passed", function() {
  throws(function(){new Autocomplete(this.target, null, globalOpts);}, "Cannot create the widget without valid data");

  throws(function(){new Autocomplete(this.target, "foo", globalOpts);}, "Data should be an array, not a string");
  throws(function(){new Autocomplete(this.target, {}, globalOpts);}, "Data should be an array, not an object");
  equal(document.querySelector('input[autocomplete]'), null, "No widget created");
});

test("Throw error if widget already here", function() {
  var auto = new Autocomplete(this.target, [], globalOpts);
  throws(function(){ new Autocomplete(this.target, [], globalOpts); }, "Cannot instantiate the widget on the same element twice");
  auto.remove();
});

asyncTest("Get widget instance with an event", function() {
  this.widget = new Autocomplete(this.target, [], globalOpts);
  var widget = this.widget;
  var cb = function(obj) {
    equal(obj, widget, "Can get a reference to the widget through events");
    start();
  };
  var evt = createEvent('getAutocomplete', cb);
  document.querySelector(this.target).dispatchEvent(evt);
});

module("Filtering data", {
  setup: function() {
    var data = [
      "Bulbasaur", "Mew", "Pikachu"
    ];
    this.data = data;
    this.target = document.querySelector('input#target');
    simulateInput(this.target, '');
    this.autocomplete = new Autocomplete(target, data, globalOpts);
  },

  teardown: function() {
    if(this.autocomplete) { this.autocomplete.remove(); }
    ok(!document.querySelector('input#target[autocomplete]'), "ok");
  }
});

test("No search query", function() {
  var allData = this.autocomplete.getFilteredData();
  equal(allData.length, 0, "No data match an empty query");
});

test("With some user input", function() {
  simulateInput(this.target, "no data for this one");
  equal(this.autocomplete.getFilteredData().length, 0, "No data for the wrong input");

  simulateInput(this.target, "Bul");
  deepEqual(this.autocomplete.getFilteredData(), ["Bulbasaur"], "Match result");

  simulateInput(this.target, "basa");
  deepEqual(this.autocomplete.getFilteredData(), ["Bulbasaur"], "Match anywhere in the data");

  simulateInput(this.target, "a");
  deepEqual(this.autocomplete.getFilteredData(), ["Bulbasaur", "Pikachu"], "Returns all matching data");
});

module("Custom accessor function for filteredData");

test("With a custom accessor function", function() {
  data = [ {name: "Bulbasaur"}, {name: "Mew"} ];
  var opts = _.extend({}, globalOpts, {value: function(d) { return d.name; }});
  var target = document.querySelector('input#target');
  var autocomplete = new Autocomplete(target, data, opts);

  simulateInput(target, "bul");
  deepEqual(autocomplete.getFilteredData(), [{name: "Bulbasaur"}], "Can specify custom accessor for complex data.");

  autocomplete.remove();
});

module("List of suggestions", {
  setup: function() {
    var data = [
      "Bulbasaur1", "Bulbasaur2", "Bulbasaur3", "Bulbasaur4", "Bulbasaur5", "Bulbasaur6", "Mew", "Pikachu"
    ];
    this.data = data;
    this.target = document.querySelector('input#target');

    simulateInput(this.target, '');
    this.autocomplete = new Autocomplete(this.target, data, globalOpts);
  },

  teardown: function() {
    this.autocomplete.remove();
    ok(!document.querySelector('input#target[autocomplete]'), "ok");
  }
});

test("Display list of suggestions", function() {
  simulateInput(this.target, "bulba");
  var children = document.querySelector('ul.frogcomplete-suggestion').children;
  equal(children.length, 6, "only show 5 suggestion by default (plus the 'more' item)");

  simulateInput(this.target, "mew");
  children = document.querySelector('ul.frogcomplete-suggestion').children;
  equal(children.length, 1, "The 'more' item is not shown if filtered result below display limit");
});

test("Custom number of displayed suggestion", function() {
  var opts = _.extend({}, globalOpts, {displayLimit: 2});
  this.autocomplete.remove();
  this.autocomplete = new Autocomplete(this.target, this.data, opts);

  simulateInput(this.target, "bulba");
  var children = document.querySelector('ul.frogcomplete-suggestion').children;
  equal(children.length, 3, "Can override the number of displayed suggestions");
});

test("Display only relevant suggestions", function() {
  simulateInput(this.target, "bulbasaur1");
  equal(document.querySelector('ul.frogcomplete-suggestion').children.length, 1,
    "Only one suggestion");
});

test("Click on suggestion copy input", function() {
  simulateInput(this.target, "bulb");
  var item = document.querySelectorAll('ul.frogcomplete-suggestion li')[0];
  item.dispatchEvent(createEvent('click'));
  equal(this.target.value, "Bulbasaur1", "Clicking on suggestion copy its content to the input");
});

test("Get the selected item with.", function() {
  simulateInput(this.target, "bulb");
  var item = document.querySelectorAll('ul.frogcomplete-suggestion li')[0];
  item.dispatchEvent(createEvent('click'));
  equal(this.autocomplete.getSelectedDatum(), "Bulbasaur1", "Can get the selected item");
});


module("Validation", {
  setup: function() {
    var data = [
      "Bulbasaur1", "Bulbasaur2", "Bulbasaur3", "Bulbasaur4", "Bulbasaur5", "Bulbasaur6", "Mew", "Pikachu"
    ];
    this.data = data;
    this.target = document.querySelector('input#target');
    simulateInput(this.target, '');
    this.form = document.querySelector('form');
  },

  teardown: function() {
    if(this.widget) { this.widget.remove(); }
    ok(!document.querySelector('input#target[autocomplete]'), "ok");
  }
});

test("Validation set to true", function() {
  var opts = _.extend({}, globalOpts, {validation: true});
  this.widget = new Autocomplete(this.target, this.data, opts);
  submitForm(this.form);
  ok(document.querySelector('.frogcomplete-error:not(.hide)'), "Error message is displayed");
});

test("Validation with a selector", function() {
  var opts = _.extend({}, globalOpts, {validation: 'form#targetForm'});
  this.widget = new Autocomplete(this.target, this.data, opts);
  submitForm(this.form);
  ok(document.querySelector('.frogcomplete-error:not(.hide)'), "Error message is displayed");
});

test("Validation with a dom node", function(){
  var targetForm = document.querySelector('form#targetForm');
  var opts = _.extend({}, globalOpts, {validation: targetForm});
  this.widget = new Autocomplete(this.target, this.data, opts);
  submitForm(this.form);
  ok(document.querySelector('.frogcomplete-error:not(.hide)'), "Error message is displayed");
});

test("Custom validation trigger", function() {
  var targetValidation = document.querySelector('div#submitTrigger');
  var opts = _.extend({}, globalOpts, {
    validation: targetValidation,
    validateTrigger: 'click'
  });
  this.widget = new Autocomplete(this.target, this.data, opts);
  targetValidation.dispatchEvent(createEvent('click'));
  ok(document.querySelector('.frogcomplete-error:not(.hide)'), "Error message is displayed");
});

