# Shift - Javascript

*Copyright (c) 2012 Erik Landvall*

*Dual licensed under the MIT and GPL version 3 licenses.*

*Version: Beta 1*

## What's this
This is a module based JavaScript framework using an MVP and event bus
pattern.

This is a only meant to work as an architectural frame. It's not meant to draw
you away from any framework/library you are currently using. This merely
completes your application with, hopefully, better structure.

I started designing this when I noticed that my front-end coding often ended
up in spaghetti code ones the projects grew.

## How it works
Every module should follow the
[MVP](http://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93presenter)
*(Model-View-Presenter)* pattern. **But you are not restricted to only use it
in this manner!**

```
                          ---------------
                          |  Presenter  |
                          ---------------
                              /      \
                             /        \
                     -----------    ----------
                     |  Model  |    |  View  |
                     -----------    ----------
```

You design the modules to function independently. When you need them to
communicate you trigger an event in the event bus that routes the event to the
presenters listening to that specific event.

```
  -------------    -------------    -------------    -------------
  |  Module1  |    |  Module2  |    |  Module3  |    |  Module4  |
  -------------    -------------    -------------    -------------
              \          \                /          /
               \          \              /          /
               -------------------------------------
               |              Event bus            |
               -------------------------------------
```

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
* dispatcher
* view:

```js
Shift.Foo = function()
{
  this.router =
  {
    'shift.ready':
      'ready'
  }

  this.dispatcher =
  {
    ready:
      function()
      {
        return 'foo';
      }
  }

  this.view =
  {
    ready:
      function( data )
      {
        alert( data );
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
action within the dispatcher and/or a matching view. The view retives data that
the dispatcher returns.

## Example of use, 3
If you do not need view or dispatcher logic for the event you don't have to
declare this resolver.

```js
Shift.Foo = function()
{
  this.router =
  {
    'shift.ready':
      'ready'
  }

  this.view =
  {
    ready:
      function()
      {
        alert( 'foo' );
      }
  }
}
```

### What is happening in the above code snippet?
We left the rout with only a view logic to resolve. We could also do it the
other way around and only use dispatcher logic.

## Example of use, 4
The module will be declared with a `service manager` if the framework is aloud
to bootstrap the module. The service manager is  where you can store global
services you wish to use in all or more then one module.

In the service manager we can locate the `event bus` that is used for
triggering new events.

```js
Shift.Foo = function( serviceManager )
{
  this.router =
  {
    'shift.ready':
      'ready',

    'foo.click':
      'click'
  }

  this.dispatcher =
  {
    click:
      function()
      {
        alert( 'clicked' );
      }
  }

  this.view =
  {
    ready:
      function()
      {
        // jQuery
        $( '#foo' ).click(
          function()
          {
            serviceManager.get( 'event-bus' ).trigger( 'foo.click' )
          } );
      }
  }
}
```

### What is happening in the above code snippet?
Here we first have the bootrap process reciving the `service manager`. We rout
the ordinary `shift.ready` event to a view where we attach a listener that
triggers the event `foo.click`. This event is triggered globaly and can be
picked up by any module. We have one rout defined for this in this module
router. The rout is beeing resolved and an alert message is triggered.

## Example of use, 5
We could also provide the router with a list of routes

```js
Shift.Foo = function( serviceManager )
{
  this.router =
  {
    'shift.ready':
      'ready',

    'foo.click':
      [ 'foo',
        'bar',
        'baz' ]
  }

  this.dispatcher =
  {
    foo:
      function()
      {
        alert( 'foo' );
      },

    bar:
      function()
      {
        alert( 'bar' );
      },

    baz:
      function()
      {
        alert( 'baz' );
      }
  }

  this.view =
  {
    ready:
      function()
      {
        // jQuery
        $( '#foo' ).click(
          function()
          {
            serviceManager.get( 'event-bus' ).trigger( 'foo.click' )
          } );
      }
  }
}
```

### What is happening in the above code snippet?
We added a list of routes that all got triggered in the order they are listed.

## Example of use, 6
For stability in your code we don't wont one modules logic breaking the hole
application if an exception is thrown. For this reason the `Shift` frame
supresses every exception that accures on bootstrap and dispatch.

If we wish to log this in some way we could create an exception module that
listens for theese error event.

**Warning** If an exception accures in the resolved rout for the
`error.dispatch` event, an endless loop will accure.

```js
Shift.Foo = function( serviceManager )
{
  this.router =
  {
    'error.bootstrap':
      'error',

    'error.dispatch':
      'error'
  }

  this.dispatcher =
  {
    error:
      function( e )
      {
        if( window.console && window.console.log )
          console.log( e );
      }
  }
}
```

### What is happening in the above code snippet?
We attached the same listener for both events and basicly loged it in the
console.

## What more
Well there's a few other things in this frame, and even more to come. In
this readme file I only described the basics. A more detailed index should
follow on a separate homepage in the future.

## Questions
If you have any questions you're more then welcome to contact me on twitter:
[ErikLandvall](https://twitter.com/ErikLandvall)
