# Shift - Javascript

*Copyright (c) 2012 Erik Landvall*

*Dual licensed under the MIT and GPL version 3 licenses.*

*Version: 0.2*

## What's this
This is a module based JavaScript framework using the MVP and event bus
patterns.

This is a only ment to work as an arktiekture frame. It's not ment to draw you
away from any framework/library you are currently using. This merly completes
your application with a *(hopefully)* better structure.

I started designing this when I noticed that my frontend coding often ended
up in spagetti code ones the projects grew.

## How it works
Every module should following the
[MVP](http://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93presenter)
*(Model-View-Presenter)* pattern.

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
comunicate you trigger an event in the event bus that routes the event to the
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

## Example of use
An shift module usuly has the following skeleton:

* Settings
  * Router
* Presenter
* Model
* View

A functional shift module could look someting like this:

```js
Shift.Module.Example =
{
  Settings:
  {
    Router :
      {
        // The event
        'doc.ready':
          // The listener. eg: Shift.Module.Example.Presenter.onDocReady
          'docReady',

        'service.error':
          'error'
      }
  },

  Presenter:
  {
    // An action
    docReady:
      function()
      {
        Shift.Module.Example.View.Email.attachValidation( this.validateEmail );
      },

    error:
      function( msg )
      {
        Shift.Module.Example.View.showError( msg );
        // Maybe you wish to set up a log model as well?
      },

    validateEmail:
      function( value )
      {
        Shift.Module.Example.Model.Email.validate(
          {
            value:
              value,

            success:
              function( data )
              {
                data == 1
                ? Shift.Module.Example.View.Email.showSuccess()
                : Shift.Module.Example.View.Email.showError();
              },

            error:
              function()
              {
                Shift.Service.get( 'eventBus' ).trigger(
                  'service.error',
                  'Couldn\'t complete email validation' );
              },
          });
      }
  },

  Model:
  {
    Email:
    {
      validate( options )
        function()
        {
          $.ajax(
          {
            url:
              '/validate/email',

            type:
              'POST',

            data:
              options.value,

            success:
              options.success,

            error:
              options.error
          });
        }
      }
  },

  View:
  {
    Email:
    {
      attachValidation:
        function( action )
        {
          $( 'input#email' ).blur(
            function()
            {
              var value = $( this ).val();
              action( value );
            }
        },

      showSuccess:
        function()
        {
          alert( 'Perfect' );
        },

      showError:
        function()
        {
          alert( 'Try that again please' );
          $( 'input#email' ).focus();
        }
    },

    showError:
      function( msg )
      {
        alert( msg );
      }
  }
}
```

This is just a simple implementation to show you how things could work. It's a
rather smal module and there for also included in only one file. If you create
a bigger module with a full layer scope and such, you could have a file
architecture that alows an even betetr code segregation, leading to less
clutter of course.

## What more
Well there is a few other things in this framework, and even more to come. In
this readme file I only described the basics. A more detailed index should
follow on a seperate homepage in the future.

## Questions
If you have any questions you're more then welcome to contact me on twitter:
[ErikLandvall](https://twitter.com/ErikLandvall)