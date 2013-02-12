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
   * The router provides matching routes, it doesn't dispatch them.
   *
   * @class
   */
  function Router( scope )
  {
    /**
     * Determines if the event matches the rout
     *
     * Expected behavior:
     *
     * |------------|------------|--------|
     * | rout       | event      | match  |
     * |============|============|========|
     * | foo.bar    | foo.bar    | true   |
     * | foo        | foo        | true   |
     * | foo.*      | foo.bar    | true   |
     * | *          | *          | true   |
     * | foo.*      | foo.*      | true   |
     * | foo.bar    | foo.*      | false  |
     * | foo        | foo.bar    | false  |
     * | foo.bar    | foo        | false  |
     * | foo        | bar        | false  |
     * |------------|------------|--------|
     */
    function match( rout, event )
    {
      var match = true;

      rout  = rout.split( '.' );
      event = event.split( '.' );

      if( rout.length != event.length )
        match = false;

      for( var i = 0; match && i < event.length; i++ )
        if( rout[ i ] != event[ i ] && '*' != rout[ i ] )
          match = false;

      return match;
    }

    /**
     * Returns all matching routes
     *
     * @exception 'Unrecognized router type'
     * @return array
     */
    this.getRoutes = function( event )
    {
      var actions = [];

      for( var module in scope )
        if( scope[ module ].router )
          for( var rout in scope[ module ].router )
            if( match( rout, event ) )
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
                    actions.push(
                      { 'module':
                          module,

                        'rout':
                          rout } );
                    break;

                  default:
                    throw 'Unrecognized router type';
                }
              } )( scope[ module ].router[ rout ] );

      return actions;
    }
  }

  /**
   * The event bus is used for triggering events in the modules
   *
   * @class
   */
  function EventBus( scope )
  {
    var router = new Router( scope );

    /**
     * Triggers an event
     *
     * @exception 'Unrecognized router type'
     * @type void
     */
    this.trigger = function trigger( eventType, data )
    {
      var routes = router.getRoutes( eventType );

      for( var i = 0; i < routes.length; i++ )
        try
        {
          var module = Shift[ routes[ i ].module ];

          data = ( module.dispatcher
                && module.dispatcher[ routes[ i ].rout ] )
                 ? module.dispatcher[ routes[ i ].rout ]( data )
                 : data;

          if( module.view
           && module.view[ routes[ i ].rout ] )
              module.view[ routes[ i ].rout ]( data );
        }
        catch( exception )
        {
          trigger(
            'error.dispatch',
            { 'module':
                routes[ i ].module,

              'rout':
                routes[ i ].rout,

              'eventType':
                eventType,

              'exception':
                   exception } );
        }
    }
  }

  // Declaring a global service manager
  var serviceManager = new Manager;

  // Attiching services
  serviceManager.set( 'event-bus', new EventBus( Shift ) );

  // Initiation process
  var interval = setInterval(
    function()
    {
      // Once the document is ready we can initiate
      if( document.readyState === 'complete' )
      {
        clearInterval( interval );

        var exceptions = {};

        // Bootstrapping all the modules that allows it
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

        // If an excpetion occurred during the bootstrap process in any of the
        // modules then this will trigger an error event
        for( var ns in exceptions )
          serviceManager.get( 'event-bus' ).trigger(
            'error.bootstrap',
            { 'module':
                ns,

              'exception':
                exception[ ns ] } );

        // Once the bootstrap process has finished, an event declaring that
        // shift is ready is triggerd
        serviceManager.get( 'event-bus' ).trigger( 'shift.ready' );
      }
    },
    10 );
}

new Shift;