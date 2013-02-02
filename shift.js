/*
  Shift - Javascript - Framework
  Copyright (C) 2012  Erik Landvall
  Dual licensed under the MIT and GPL version 3
*/

/**
 * @type Shift
 */
function Shift()
{
  /**
   * A manager mange services
   *
   * @class
   */
  function Manager()
  {
    var container = {};

    /**
     * Set a service that can be acceced through the defined namespace.
     *
     * @param namespace string The desired namespace, will overwrite if
     * namespace already exists.
     * @param service object The service
     * @type void
     */
    this.set = function( namespace, service )
    {
      namespace = namespace.toLowerCase();
      container[ namespace ] = service;
    }

    /**
     * Used to retrieve a service from a certain namespace
     *
     * @param namespace string The namespace
     * @exception 'Namespace undefined'
     * @return object
     */
    this.get = function( namespace )
    {
      namespace = namespace.toLowerCase();

      if( !container[ namespace ] )
        throw 'Namespace undefined';

      return container[ namespace ];
    }

    /**
     * Used to retrieve all availible services
     *
     * @return object
     */
    this.getAll = function()
    {
      return container;
    }

    /**
     * Is used for removing a service from the manager
     *
     * @type void
     */
    this.remove = function( ns )
    {
      delete container[ ns ];
    }

    /**
     * Returns if a namespace is set or not
     *
     * @param namespace string The namespace
     * @return boolean
     */
    this.has = function( namespace )
    {
      namespace = namespace.toLowerCase();

      return !! container[ namespace ];
    }
  }

  /**
   * The event bus is used for triggering events in the modules
   *
   * @class
   */
  function EventBus()
  {
    this.trigger = function trigger( eventType, data )
    {
      for( var module in Shift )
        if( Shift[ module ].router
         && Shift[ module ].router[ eventType ] )
          ( function callback( rout )
          {
            switch( typeof rout )
            {
              case 'object':
                if( rout instanceof Array )
                  for( var i = 0; i < rout.length; i++ )
                    callback( rout[ i ] );

                else
                  for( var ns in rout )
                    callback( rout[ ns ] );

                break;

              case 'string':
                  /* If an exception accures during dispatch then it will be
                   * cought here and prevent a total melt down
                   */
                  try
                  {
                    data = ( Shift[ module ].dispatcher
                          && Shift[ module ].dispatcher[ rout ] )
                           ? Shift[ module ].dispatcher[ rout ]( data )
                           : data;

                    if( Shift[ module ].view
                     && Shift[ module ].view[ rout ] )
                        Shift[ module ].view[ rout ]( data );
                  }
                  catch( exception )
                  {
                    trigger(
                      'error.dispatch',
                      { 'exception':
                          exception,

                        'module':
                          module,

                        'rout':
                          rout,

                        'eventType':
                          eventType } );
                  }
                break;

              default:
                throw 'Unrecognized router type';
            }
          } )( Shift[ module ].router[ eventType ] );
    }
  }

  var
  serviceManager = new Manager;
  serviceManager.set( 'event-bus', new EventBus );

  jQuery( document ).ready(
    function()
    {
      var exceptions = {};

      for( var module in Shift )
        if( typeof Shift[ module ] == 'function' )
          try
          {
            Shift[ module ] = new Shift[ module ]( serviceManager );
          }
          catch( exception )
          {
            exceptions[ module ] = exception;
            delete Shift[ module ];
          }

      for( var ns in exceptions )
        serviceManager.get( 'event-bus' ).trigger(
          'error.bootstrap',
          { 'exception':
              exception[ ns ],

            'module':
              ns } );

      serviceManager.get( 'event-bus' ).trigger( 'shift.ready' );
    } );
}

new Shift;