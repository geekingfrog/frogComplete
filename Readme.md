# FrogComplete
**FrogComplete** is a simple autocompletion widget in vanilla javascript.
There is a [live demo](http://geekingfrog.com/frogComplete/demo/demo.html) !

This is an pre-interview assignment for Mozilla Taiwan to work on firefox OS as a web engineer. There was some requirements:
* Avoid using well-known UI libraries. 
* The dataset should contains around 100~1000 entries. (typical dataset provided).
* User should be blocked from submit the input unless the input matches one of the entries. 
* The whole thing should work when loading from http://localhost/ or 
file:/// url, without server-side (e.g. PHP) logic. 
* Please take care of memory consumption and efficiency. 
* Consider making your code unit-testable and reusable. 

Note that the demo uses third party libraries and css, but none of these are required to run the widget and have a decent output.

# Usage and browser support
Include the library and the stylesheet.
```html
<link rel="stylesheet" href="./lib/autocomplete.css" type="text/css" />
<script src="./lib/autocomplete.js" type="text/javascript"></script>
```

```javascript
var data = ["blue", "green", "red", "orange", "purple", "yellow"];
new Autocomplete('input#colors', data);
```

This library has been tested on Firefox 23, Chromium 28, Chrome 29 for android and Firefox 23 for android. See known bug and limitation section for a few gotcha.
There is no 3rd party library required, just make sure you have a recent browser.

To run the tests, you need [node.js](http://http://nodejs.org/) and [Grunt](http://gruntjs.com) installed. Then:
```javascript
npm install
grunt
```

# Documentation

## Creation
`new Autocomplete(target, data, options);`
* target can be a selector (string) or a dom node
* data must be a javascript Array
* options is an optional javascript hash

```html
<input type="text" id="target">
```

```javascript
var data = ["blue", "green", "red", "orange", "purple", "yellow"];

// Pass a selector
new Autocomplete('input#target', data);

// or directly a dom element
new Autocomplete(document.querySelector('input#target'), data);
```

### Options
* `value`: This is a function which take an item in `data` and returns a string. This string will be used to check wether an item can complete the current user input. The default function returns the datum cast as string.
```javascript
var timezones = [{"cc":"TW", "offset":"+08:00,+08:00", "city":"Taipei"}];
new Autocomplete('input#timezones', timezones, {
  value: function(datum) { return datum.city; }
});
```

* `display`: Sometimes you want to show more information in the suggestion list, or you want to emphasize the current matching part of the user input. Display is a function which takes two arguments: the matched item and the user input, and returns a string (with some html inside if you want). The default function put the user's input between `<strong></strong>` tag
```javascript
var options = {
  value: function(d) { return d.city; },
  display: function(datum, input) {
    var transform = new RegExp("(" + input + ")", "i");
    return datum.city.replace(transform, "<span style='color: red;'>$1</span>");
  }
};
new Autocomplete('input#timezones', timezones, options);
```

* `verbose`: Put that to false if you want a silent widget.

* `validateTarget`. If you want the widget to prevent form submission unless the user selected an item. If the target input is inside a `form` element, just put `validation: true` and the widget will automatically find the form and do its things. If you want to control the behavior of other element, then, you can pass any valid selector or a dom node. In this case, you should also specify `validateTrigger`.
```javascript
// validation on custom element: <div class="button" id="clickMe">
var options = {
  validation: '#clickMe',
  validateTrigger: 'click'
};
``` 

## API
`var widget = new Autocomplete('input', []);`
* `widget.remove()`. Pretty explicit. Will clean up everything and remove itself.
* `widget.getData()` Returns the data used by the widget.
* `widget.isInputValid()` Return true if the current content of the input has been selected from the list of suggestion.
* `widget.getSelectedDatum()` Return the selected item or null if nothing has been selected.
* `widget.getFilteredData()` Return the subset of data which can be used to complete the user's input.
* `Event: getAutocomplete` If you don't have a reference to the widget but only know the dom element with it, you can send an event to this element. Attach a callback to this event. It will be called with the instance of the widget as the only argument.
```javascript
var callback = function(widget) {
  //do something with the widget here.
}
var event = new CustomEvent('getAutocomplete', {detail: callback});
document.querySelector('input').dispatchEvent(event);
```

# Limitations and known bugs
* On Chrome 29 for android, the validation doesn't work after the user has chosen an item, and then changed it.
* The validation uses a handle on the 'submit' event of the form. Calling form.submit() bypass these handlers and thus, the validation is not performed. If you want to use the validation feature, please don't use form.submit() (or do it after manually checking if the input is valid)
* You may want to override some of the css for the suggestion list and the error message regarding the positioning. This depend on the existing styling on your form fields.

