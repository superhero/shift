/*
  Shift - Javascript - Framework
  Copyright (C) 2012  Erik Landvall
  Dual licensed under the MIT and GPL version 3
*/

var Shift = ( function()
{
  var
  
  /**
   * The core object that will be returned in the end
   */
  Shift =
  {
    /**
     * Service manager
     * Used similar to a registry but with more functionality
     */
    Service :
      ( function()
      {
        var
        Cache   = {},
        Manager =
        {
          /**
           * The availible modes
           */
          Mode:
            {
              SERVICE:
                'service',

              FACTORY:
                'factory'
            },

          /**
           * Set a service that can be acceced through the defined namespace.
           * 
           * @param namespace string The desired namespace, will overwrite if
           * namespace already exists.
           * @param input object|function The different modes accepts different
           * type values:
           * service   = object,
           * factory   = function
           * @param mode string One of the "constants" availible in 
           * Service.Mode. Defaults to Service.Mode.SERVICE
           * @type void
           */
          set:
            function( namespace, input, mode )
            {
              Cache[ namespace.toLowerCase() ] = 
                {
                  'mode':
                    mode || this.Mode.SERVICE,

                  'input':
                    input
                }
            },

          /**
           * Used to retrieve a service from a certain namespace 
           * 
           * @param namespace string The namespace
           * @exception 'Namespace undefined'
           * @exception 'Unrecognized mode'
           */
          get:
            function( namespace )
            {
              namespace = namespace.toLowerCase();
              
              if( ! Cache[ namespace ] )
                throw 'Namespace undefined';

              switch( Cache[ namespace ].mode )
              {
                case 'service':
                  return Cache[ namespace ].input;

                case 'factory':
                  Cache[ namespace ].input = Cache[ namespace ].input();
                  Cache[ namespace ].mode  = this.Mode.SERVICE;

                  return Cache[ namespace ].input;

                default:
                  throw 'Unrecognized mode used in the service manager';
              }
            },

          /**
           * Returns if a namespace is set or not
           * 
           * @param namespace string The namespace
           * @return boolean
           */
          exists:
            function( namespace )
            {
              return !! Cache[ namespace ];
            }
        }

        return Manager;
      })(),
    
    /**
     * The module container
     */
    Module: {}
  };
  
  // Setting up the event bus
  
  Shift.Service.set(
    'eventBus',
    
    /* The event bus is used for triggering events across all the existing 
     * modules
     */
    new function()
    {
      this.trigger = function( event, input )
      {
        input = input || null;

        var Modules = Shift.Module;

        for( var module in Modules )
          if( Modules[ module ].Settings )
            if( Modules[ module ].Settings.Router )
              if( Modules[ module ].Settings.Router[ event ] )
                ( function callback( Router )
                {
                  switch( typeof Router )
                  {
                    case 'object':
                      if( Router instanceof Array )
                        for( var i = 0; i < Router.length; i++ )
                          callback( Router[ i ] );
                      else
                        for( var i in Router )
                          callback( Router[ i ] );
                      break;

                    case 'string':
                      if( Modules[ module ].Presenter )
                        ( function callback( presenter, Router )
                        {
                          /* This "try-catch" expression will prevent two things
                           * 
                           * 1. If the requested presenter dosn't exist it will
                           * return with no error
                           * 
                           * 2. If an exception accures in the presenter this 
                           * will here be cought and prevent a melt down
                           * 
                           * @todo Add a function that logs the problems that 
                           * occur..
                           */
                          try
                          {
                            presenter = presenter[ Router.shift() ];

                            Router.length > 0
                              ? callback( presenter, Router )
                              : ( typeof presenter == 'function'
                                ? presenter( input )
                                : null );
                          }
                          catch( e )
                          {
                            return;
                          }
                        })( Modules[ module ].Presenter, Router.split( '.' ));
                      break;
                      
                    default:
                      throw 'Unrecognized router type';
                  }
                })( Modules[ module ].Settings.Router[ event ] );
      }
    });
  
  // Initiation
  
  ( function()
  { 
    var ready = function()
    {
      Shift.Service.get( 'eventBus' ).trigger( 'docReady'  );
    }
    
    if( typeof jQuery != 'undefined' )
      jQuery( document ).ready( ready );

    else if( window.addEventListener )
      window.addEventListener( 'load', ready, false );

    else if( window.attachEvent )
      window.attachEvent( 'onload', ready );
  })();
  
  return Shift;
})();