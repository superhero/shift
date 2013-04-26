/*
  Shift - Javascript - Framework
  Copyright (C) 2013  Erik Landvall
  Dual licensed under the MIT and GPL version 3
*/

/**
 * @returns {Shift}
 */
function Shift()
{
  /**
   * @returns {Shift.Manager}
   */
  function Manager()
  {
    var container = {};

    /**
     * Set a service that can be acceced through the defined namespace.
     *
     * @param {String} namespace The desired namespace, will overwrite if
     * namespace already exists.
     * @param {Object} service The service
     * @returns {undefined}
     */
    this.set = function(namespace, service)
    {
      namespace = namespace.toLowerCase();
      container[namespace] = service;
    }

    /**
     * Used to retrieve a service from a certain namespace
     *
     * @param {String} namespace The namespace
     * @returns {Object}
     * @throws {Namespace undefined}
     */
    this.get = function(namespace)
    {
      namespace = namespace.toLowerCase();

      if(!container[namespace])
        throw 'Namespace undefined';

      return container[namespace];
    }

    /**
     * Used to retrieve all availible services
     *
     * @returns {Object}
     */
    this.getAll = function()
    {
      return container;
    }

    /**
     * Is used for removing a service from the manager
     *
     * @returns {undefined}
     */
    this.remove = function(ns)
    {
      delete container[ns];
    }

    /**
     * Returns if a namespace is set or not
     *
     * @param {String} namespace The namespace
     * @returns {Boolean}
     */
    this.has = function(namespace)
    {
      namespace = namespace.toLowerCase();

      return !! container[namespace];
    }
  }
  

  /**
   * The router provides matching routes, it doesn't dispatch them.
   * 
   * @returns {Shift.Router}
   */
  function Router()
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
     * 
     * @param {String} rout The rout to compare to
     * @param {String} event The event to compare with
     * @returns {Boolean}
     */
    function match(rout, event)
    {
      var match = true;

      rout = rout.split('.');
      event = event.split('.');

      if(rout.length != event.length)
        match = false;

      for(var i = 0; match && i < event.length; i++)
        if(rout[i] != event[i] && '*' != rout[i])
          match = false;

      return match;
    }
    
    /**
     * Returns all matching routes
     * 
     * @param {String} event The event that should be matched agains the routes
     * in the current scope
     * @param {Object} scope A container with the relevenat modules to search
     * for routes in.
     * @returns {Array}
     * @throws {Unrecognized router type}
     */
    this.getRoutes = function(event, scope)
    {
      var actions = [];

      for(var module in scope)
        if(scope[module].router)
          for(var rout in scope[module].router)
            if(match(rout, event))
              (function callback(rout)
              {
                switch(typeof rout)
                {
                  case 'object':
                    if(rout instanceof Array)
                      for(var i = 0; i < rout.length; i++)
                        callback(rout[i]);

                    else
                      for(var ns in rout)
                        callback(rout[ns]);

                    break;

                  case 'string':
                    actions.push(
                      { 
                        'module': module,
                        'rout': rout 
                      });
                    break;

                  default:
                    throw 'Unrecognized router type';
                }
              })(scope[module].router[rout]);

      return actions;
    }
  }
  
  /**
   * @param {Object} scope A container of the modules that should be affected 
   * when an event is triggered 
   * @returns {Shift.EventBus}
   */
  function EventBus(scope)
  {
    var router = new Router();
    
    /**
     * This couses the application to work asynchronously through diffrent
     * event. It should also help queuing up rendering work in some browsers.
     * 
     * @param {Object} route Where the route information is held.
     * @param {String} eventType The type of event.
     * @param {mix} data Anything that is passed from the trigger.
     * @param {Shift.EventBus} eventBus The event bus that we can use to 
     * trigger an error if so is needed.
     * @returns {Shift.EventBus.Thread}
     */
    function Thread(route, eventType, data, eventBus)
    {
      this.run = function()
      {
        setTimeout(this.dispatch, 0);
      }
      
      this.dispatch = function()
      {
        try
        {
          // A handle to the module we are about to dispatch from
          var module = Shift[route.module];

          // If the controller existes, the return value from this will be 
          // passed on to the view. 
          // If no controller existes, the data passed through the event will
          // be passed on to the view.
          data = ( module.controller && module.controller[route.rout] )
                 ? module.controller[route.rout](data)
                 : data;

          // If a view existes it will be rendered with the data passed on.
          if(module.view && module.view[route.rout])
            module.view[route.rout](data);
        }

        // Preventing an eception in the dispatch proces to couse a melt-down
        catch(exception)
        {
          // Composes an exception with more information
          var e = 
          { 
            'Module': route.module,
            'Rout': route.rout,
            'Event': eventType,
            'Exception': exception 
          };

          // Preventing an eternal loop
          if(eventType == 'error.dispatch')
            throw 'Eternal loop found in Shift.\n' + 
                  '\n' + 
                  'Event: "'     + eventType  + '"\n' +
                  'Module: "'    + e.Module   + '"\n' +
                  'Rout: "'      + e.Rout     + '"\n' + 
                  'Exception: "' + exception  + '"';

          // Trigger a user defined exception handler - preferably a logger
          else
            eventBus.trigger('error.dispatch', e);
        }
      }
    }

    /**
     * Triggers an event
     *
     * @param {String} eventType The event type name.
     * @param {mix} data What ever that is sent when the event is triggered, if
     * anything at all.
     * @returns {undefined}
     * @throws {Unrecognized router type}
     * @throws {Eternal loop found in Shift..}
     */
    this.trigger = function(eventType, data)
    {
      // Retrives matching routes
      var routes = router.getRoutes(eventType, scope);

      // Looping through all matched routes
      for(var i = 0; i < routes.length; i++)
        new Thread(routes[i], eventType, data, this).run();
    }
  }

  // Declaring a global service manager
  var serviceLocator = new Manager;

  // Attiching services
  serviceLocator.set('event-bus', new EventBus(Shift));

  var
  // Callback to notice when the document is ready
  initiationCallback = function()
  {
    // Once the document is ready we can initiate
    if(document.readyState === 'complete')
    {
      clearInterval(initiationInterval);
      
      bootstrap();
    }
  },
  
  // The bootstrap process
  bootstrap = function()
  {
    var exceptions = {};

    // Bootstrapping the modules
    for(var module in Shift)
      if(typeof Shift[module] == 'function')
        try
        {
          Shift[module] = new Shift[module](serviceLocator);
        }
        
        // Logging wich modules that where unable to bootstrap and removes it
        // from Shift to prevent future use.
        catch(exception)
        {
          exceptions[module] = exception;
          delete Shift[module];
        }

    // If an excpetion occurred during the bootstrap process in any of the
    // modules then this will trigger an error event
    for(var ns in exceptions)
      serviceLocator.get('event-bus').trigger(
        'error.bootstrap',
        {
          'Module': ns,
          'Exception': exceptions[ns] 
        });

    // Once the bootstrap process has finished, an event declaring that
    // shift is ready is triggerd
    serviceLocator.get('event-bus').trigger('shift.ready');
  },

  // Initiation
  initiationInterval = setInterval(initiationCallback, 10);
}

new Shift;