# Shift - Javascript

*Copyright (c) 2013 Erik Landvall*

*Dual licensed under the MIT and GPL version 3 licenses.*

*Version: 1.0.0*

## What is this
This is a module based JavaScript framework using the MVP pattern and an
event bus for framework event handling.

This is only meant to work as an architectural frame. It's not meant to draw
you away from any library you are currently using. This merely completes your
application with, hopefully, better structure.

I started designing this when I noticed that my front-end coding often ended
up in spaghetti code ones the projects grew.

## How it works
Every module should follow the
[MVP](http://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93presenter)
(Model-View-Presenter) or
[MVC](http://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller)
(Model-View-Controller) pattern.

**See**:
 * [Supervising Controller](http://martinfowler.com/eaaDev/SupervisingPresenter.html)

You design the modules to operate independently. When you need them to
communicate you trigger an event in the event bus that routes the event to the
presenters listening to that specific event.

## Example of use, 1
In it's most basic form, all you need to define is a module that will be
triggered when document is ready.

```js
Shift.Foo = function()
{
  // Do stuff..
}
```

### What is happening in the above code snippet?
We are declaring the `Foo` module while adding it to the `Shift` object. The
module body is triggered when the document is ready. This process is also
considered as the module bootstrap process.

## Example of use, 2
A shift module usually has the following skeleton:

* router
* controller
* view:

```js
Shift.Foo = function()
{
  this.router =
  {
    'shift.ready': 'ready'
  }

  this.controller =
  {
    ready: function()
    {
      return 'foo';
    }
  }

  this.view =
  {
    ready: function(data)
    {
      alert(data);
    }
  }
}
```

### What is happening in the above code snippet?
In the framework we hava an `event bus` that triggers the event `shift.ready`
onece all modules has been bootstrapped.
When an event is triggered the `event bus` walks through all modules looking
for a router. If an router is found the `event bus` will attempt to find a
matching rout. If one is found it will attempt to resolve this to a matching
action within the controller and/or a matching view. The view retives data that
the controller returns.

## Example of use, 3
If you do not need view or controller logic for the event you don't have to
declare this resolver.

```js
Shift.Foo = function()
{
  this.router =
  {
    'shift.ready': 'ready'
  }

  this.view =
  {
    ready: function()
    {
      alert('foo');
    }
  }
}
```

### What is happening in the above code snippet?
We left the rout with only a view logic to resolve. We could also do it the
other way around and only use controller logic.

## Example of use, 4
The module will be declared with a `service locator` if the framework is aloud
to bootstrap the module. The service locator is  where you can store global
services you wish to use in all or more then one module.

In the service locator we can locate the `event bus` that is used for
triggering new events.

```js
Shift.Foo = function(serviceLocator)
{
  this.router =
  {
    'shift.ready': 'ready',
    'foo.click': 'click'
  }

  this.controller =
  {
    click: function()
    {
      alert('clicked');
    }
  }

  this.view =
  {
    ready: function()
    {
      // jQuery
      $('#foo').click(
        function()
        {
          serviceLocator.get('event-bus').trigger('foo.click')
        });
    }
  }
}
```

### What is happening in the above code snippet?
Here we first have the bootrap process reciving the `service locator`. We rout
the ordinary `shift.ready` event to a view where we attach a listener that
triggers the event `foo.click`. This event is triggered globaly and can be
picked up by any module. We have one rout defined for this in this module
router. The rout is beeing resolved and an alert message is triggered.

## Example of use, 5
We could also provide the router with a list of routes

```js
Shift.Foo = function(serviceLocator)
{
  this.router =
  {
    'shift.ready': 'ready',

    'foo.click':
      [
        'foo',
        'bar',
        'baz'
      ]
  }

  this.controller =
  {
    foo: function()
    {
      alert('foo');
    },

    bar: function()
    {
      alert('bar');
    },

    baz: function()
    {
      alert('baz');
    }
  }

  this.view =
  {
    ready: function()
    {
      // jQuery
      $('#foo').click(
        function()
        {
          serviceLocator.get('event-bus').trigger('foo.click')
        });
    }
  }
}
```

### What is happening in the above code snippet?
We added a list of routes that all got triggered.

## Example of use, 6
For stability in your code we don't wont one modules logic breaking the hole
application if an exception is thrown. For this reason the `Shift` frame
supresses every exception that accures on bootstrap and dispatch.

If we wish to log this in some way we could create an exception module that
listens for theese error event.

**Warning** If an exception accures in the resolved rout for the
`error.dispatch` event, a real exception will be trown breaking that thread.

```js
Shift.Foo = function(serviceLocator)
{
  this.router =
  {
    'error.bootstrap': 'error',
    'error.dispatch': 'error'
  }

  this.view =
  {
    error: function(e)
    {
      if(window.console && window.console.log)
        console.log(e);
    }
  }
}
```

### What is happening in the above code snippet?
We attached the same listener for both events and basicly loged it in the
console.

## Example of use, 7
A simpler way to hook the "Example 6" is to use the asterix symbole

```js
Shift.Foo = function(serviceLocator)
{
  this.router =
  {
    'error.*': 'error'
  }

  this.view =
  {
    error: function(e)
    {
      if(window.console && window.console.log)
        console.log(e);
    }
  }
}
```

### What is happening in the above code snippet?
We used the asterix symbole in the router to match any name in that part of the
rout.

## What more
Well there's a few other things in this frame, and even more to come. In
this readme file I only described the basics. A more detailed index should
follow on a separate homepage in the future.

## Questions
If you have any questions you're more then welcome to contact me on twitter:
[ErikLandvall](https://twitter.com/ErikLandvall)
