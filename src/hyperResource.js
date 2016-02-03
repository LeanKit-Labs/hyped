var _ = require( "lodash" );
var pluralize = require( "pluralize" );
var links = require( "./links" );
var versions = require( "./versions" );
var when = require( "when" );

function addOptionLinksForResource( resource, resourceName, createLink, envelope, options ) {
	return when.all( _.map( resource.actions, function( action, actionName ) {
		function onMain( main ) {
			if ( !_.isEmpty( main ) ) {
				options._links[ [ resourceName, actionName ].join( ":" ) ] = main[ actionName ];
			}
		}
		return action.hidden ? when.resolve() : createLink( resourceName, actionName, envelope, {} )
			.then( onMain );
	} ) );
}

function getExclusion( exclude, unit ) {
	return exclude ? function( data ) {
		return _.omit( data, exclude );
	} : unit;
}

function getInclusion( include, unit ) {
	return include ? function( data ) {
		return _.pick( data, include );
	} : unit;
}

function getFilter( filter, unit ) {
	return filter ? function( data ) {
		return _.pick( data, filter );
	} : unit;
}

function getMap( map, unit ) {
	return map ? function( data ) {
		return map( data );
	} : unit;
}

function getBodyCache( resources, prefix, version ) {
	var cache = {};
	_.reduce( resources, function( rAcc, resource, resourceName ) {
		resource = versions.getVersion( resource, version );
		rAcc[ resourceName ] = _.reduce( resource.actions, function( acc, action, actionName ) {
			var unit = function( x ) {
				return x;
			};
			var embedded = _.keys( action.embed );
			var include = getInclusion( action.include, unit );
			var exclude = getExclusion( action.exclude, unit );
			if ( action.include ) {
				embedded = _.difference( embedded, include );
			}
			var filter = getFilter( action.filter, unit );
			var map = getMap( action.transform, unit );
			var strip = removeEmbedded( embedded, unit );
			var fn = _.compose( strip, map, filter, exclude, include );
			acc[ actionName ] = function( data ) {
				var cloned = _.cloneDeep( data );
				return fn( cloned );
			};
			return acc;
		}, {} );
		return rAcc;
	}, cache );
	return cache;
}

function getBodyGenerator( resources, prefix, version ) {
	var renderCache = getBodyCache( resources, prefix, version );
	return function( resourceName, actionName, data ) {
		return renderCache[ resourceName ][ actionName ]( data );
	};
}

function getOptionCache( resources, prefix, version, excludeChildren, envelope, skipAuth ) {
	var createLink = links.getLinkGenerator( resources, prefix, version, true, skipAuth );
	var options = { _links: {} };
	var versionList = [ "1" ];
	return when.all(
		_.map( resources, function( resource, resourceName ) {
			versionList = versionList.concat( resource.versions ? _.keys( resource.versions ) : [] );
			resource = versions.getVersion( resource, version );
			if ( !resource.parent || !excludeChildren ) {
				return addOptionLinksForResource( resource, resourceName, createLink, envelope, options );
			}
		} )
	).then( function() {
		options._versions = _.unique( versionList );
		return options;
	} );
}

function getOptionGenerator( resources, prefix, version, excludeChildren, envelope, skipAuth ) {
	return function( types ) {
		return getOptionCache( resources, prefix, version, excludeChildren, envelope, skipAuth )
			.then( function( options ) {
				options._mediaTypes = _.keys( types );
				return options;
			} );
	};
}

function getOriginCache( resources, prefix, version ) {
	var cache = {};
	var createUrl = links.getUrlGenerator( resources, prefix, version );

	_.reduce( resources, function( rAcc, resource, resourceName ) {
		resource = versions.getVersion( resource, version );
		rAcc[ resourceName ] = _.reduce( resource.actions, function( acc, action, actionName ) {
			var method = action.method.toUpperCase();
			acc[ actionName ] = function( parentUrl ) {
				var actionUrl = createUrl( resourceName, actionName, {}, parentUrl, {} );
				return { href: actionUrl, method: method };
			};
			return acc;
		}, {} );
		return rAcc;
	}, cache );
	return cache;
}

function getOriginFn( resources, prefix, version ) {
	var originCache = getOriginCache( resources, prefix, version );
	return function( resourceName, actionName, envelope, parentUrl ) {
		return originCache[ resourceName ][ actionName ]( envelope.data, parentUrl );
	};
}

function getRenderGenerator( resources, prefix, version ) {
	var resourceGenerator = getResourceGenerator( resources, prefix, version );
	var resourcesGenerator = getResourcesGenerator( resources, prefix, version );

	return function( resourceName, actionName, envelope, data, parentUrl, originUrl, originMethod, useHal ) {
		if ( _.isArray( data ) || data && data._list ) {
			return resourcesGenerator( resourceName, actionName, envelope, data, parentUrl, originUrl, originMethod, useHal );
		} else {
			return resourceGenerator( resourceName, actionName, envelope, data, parentUrl, originUrl, originMethod, useHal );
		}
	};
}

function getResourceCache( resources, prefix, version ) {
	var cache = {};
	var render = getBodyGenerator( resources, prefix, version );
	var createLink = links.getLinkGenerator( resources, prefix, version );
	var createLinkNoAuth = links.getLinkGenerator( resources, prefix, version, true, true );
	var getPrefix = links.getPrefix.bind( undefined, resources, prefix );

	_.reduce( resources, function( rAcc, resource, resourceName ) {
		resource = versions.getVersion( resource, version );
		var prefixes = getPrefix( resource );
		var urlPrefix = [
				prefixes.urlPrefix,
				resource.urlPrefix,
				prefixes.apiPrefix
			].join( "" ).replace( "//", "/" );
		rAcc[ resourceName ] = _.reduce( resource.actions, function( acc, action, actionName ) {
			acc[ actionName ] = resourceGenerator.bind( undefined, {
				action: action,
				actionName: actionName,
				createLink: createLink,
				createLinkNoAuth: createLinkNoAuth,
				cache: cache,
				render: render,
				resource: resource,
				resources: resources,
				resourceName: resourceName,
				urlPrefix: urlPrefix
			} );
			return acc;
		}, {} );
		return rAcc;
	}, cache );
	return cache;
}

function getResourceGenerator( resources, prefix, version ) { // jshint ignore:line
	var resourceCache = getResourceCache( resources, prefix, version );
	return function( resourceName, actionName, envelope, data, parentUrl, originUrl, originMethod, useHal ) {
		return resourceCache[ resourceName ][ actionName ]( envelope, data, parentUrl, originUrl, originMethod, useHal );
	};
}

function getResourcesGenerator( resources, prefix, version ) { // jshint ignore:line
	var resourceCache = getResourceCache( resources, prefix, version );
	var originFn = getOriginFn( resources, prefix, version );

	return function( resourceName, actionName, envelope, data, parentUrl, originUrl, originMethod, useHal ) {
		var body = {};
		var meta = _.isArray( data ) ? {} : _.omit( data, [ "_list", "_alias" ] );
		var resource = versions.getVersion( resources[ envelope.resource ], version );
		var itemResource = versions.getVersion( resources[ resourceName ], version );
		var render = itemResource.actions[ actionName ].render;
		var renderResource = render ? render.resource || resourceName : resourceName;
		var renderAction = render ? render.action || actionName : actionName;
		var alias = data && data._alias || pluralize.plural( renderResource );
		var list = data && data._list || data;

		// determine what set of actions to render for the list
		var action = resource.actions[ envelope.action ];
		var actions = action.actions || _.keys( resource.actions );
		var actionList = _.pick( resource.actions, actions );

		var createLink = links.getLinkGenerator( resources, prefix, version );
		var promises = _.map( list, function( item, index ) {
			var child = list[ index ];
			return resourceCache[ renderResource ][ renderAction ]( envelope, child, parentUrl, undefined, undefined, useHal );
		} );

		// render additional metadata for the list
		function attachMetadata( body ) {
			if ( !_.isEmpty( meta ) ) {
				return resourceCache[ resourceName ][ actionName ]( envelope, meta, parentUrl, undefined, undefined, useHal )
					.then( function( metadata ) {
						return _.merge( {}, body, metadata );
					} );
			} else {
				return body;
			}
		}

		// attach hypermedia
		function attachHypermedia( body ) {
			// request related metadata
			if ( originUrl && originMethod ) {
				body._origin = { href: originUrl, method: originMethod };
			} else {
				body._origin = originFn( resourceName, actionName, data[ 0 ], parentUrl );
			}
			body._action = envelope.action;
			body._resource = envelope.resource;
			return when.all(
				_.map( actionList, function( link, linkName ) {
					return createLink( envelope.resource, linkName, envelope, data, parentUrl );
				} ) )
			.then( function( list ) {
				body._links = _.merge.apply( undefined, list );
				return body;
			} );
		}

		// put it all together now ...
		var result = when.all( promises )
			.then( function( listItems ) {
				body[ alias ] = listItems;
				return body;
			} )
			.then( attachMetadata );

		if ( useHal ) {
			result = result.then( attachHypermedia );
		}
		return result;
	};
}

function getRoutesCache( resources, prefix, version ) {
	var createRoute = links.getRouteGenerator( resources, prefix, version );
	var createLink = links.getLinkGenerator( resources, prefix, version );
	var options = { _links: {} };
	var versionList = [ "1" ];
	_.each( resources, function( resource, resourceName ) {
		versionList = versionList.concat( resource.versions ? _.keys( resource.versions ) : [] );
		resource = versions.getVersion( resource, version );

		_.each( resource.actions, function( action, actionName ) {
			var main = createRoute( resourceName, actionName, {}, {} );

			if ( !_.isEmpty( main ) ) {
				options._links[ [ resourceName, actionName ].join( ":" ) ] = main[ actionName ];
			}
			_.each( action.links, function( link, linkName ) {
				var additional = _.values( createLink( resourceName, linkName, {}, {} ) )[ 0 ];
				if ( !_.isEmpty( additional ) ) {
					options._links[ [ resourceName, linkName ].join( ":" ) ] = additional;
				}
			} );
		} );
	} );
	options._versions = _.unique( versionList );
	return options;
}

function getRouteGenerator( resources, prefix, version ) {
	return function( types ) {
		var routes = getRoutesCache( resources, prefix, version );
		routes._mediaTypes = _.keys( types );
		return routes;
	};
}

function removeEmbedded( embedded, unit ) { // jshint ignore:line
	return embedded ? function( data ) {
		return _.omit( data, embedded );
	} : unit;
}

function resourceGenerator( state, envelope, data, parentUrl, originUrl, originMethod, useHal ) {
	var action = state.action;
	var actionName = state.actionName;
	var createLink = state.createLink;
	var createLinkNoAuth = state.createLinkNoAuth;
	var cache = state.cache;
	var render = state.render;
	var resource = state.resource;
	var resources = state.resources;
	var resourceName = state.resourceName;
	var urlPrefix = state.urlPrefix;
	var actions = action.actions || _.keys( resource.actions );
	var actionList = _.pick( resource.actions, actions );
	var body = render( resourceName, actionName, data );

	function onLink( mainLink ) {
		var ownLinks = _.map( actionList, function( link, linkName ) {
			if ( actionName === linkName ) {
				return createLinkNoAuth( resourceName, linkName, envelope, data, parentUrl );
			} else {
				return createLink( resourceName, linkName, envelope, data, parentUrl );
			}
		} );

		var otherLinks = [];
		if ( resource.hoist ) {
			var inheritedData = _.cloneDeep( data );
			inheritedData[ resourceName ] = data;
			otherLinks = _.map( resource.hoist, function( hoistedActions, hoistedResource ) {
				return _.map( hoistedActions, function( actionName ) {
					var hoistedActionName = [ hoistedResource, actionName ].join( ":" );
					if ( action.actions && action.actions.length && _.contains( action.actions, hoistedActionName ) ) {
						return createLink( hoistedResource, actionName, envelope, inheritedData, parentUrl )
							.then( function( link ) {
								link[ hoistedActionName ] = link[ actionName ];
								delete link[ actionName ];
								return link;
							} );
					}
				} );
			} );
		}

		return when.all( ownLinks.concat( _.flatten( otherLinks ) ) )
			.then( function( list ) {
			return { origin: mainLink, actions: _.merge.apply( undefined, list ) };
		} );
	}

	function onLinks( links ) {
		var origin = ( originUrl && originMethod ) ?
			{ href: originUrl, method: originMethod } :
			links.origin[ actionName ];
		body._links = links.actions;
		body._origin = origin;
		body._resource = resourceName;
		body._action = actionName;
		return body;
	}

	function onBody( body ) {
		var eAcc = {};

		function renderChild( childFn, inheritedUrl, child ) {
			return childFn( envelope, child, inheritedUrl, undefined, undefined, useHal )
				.then( function( item ) {
					if ( child.actions ) {
						item._links = _.pick( item._links, child.actions );
					}
					return item;
				} );
		}

		var embedded = _.reduce( action.embed, function( promises, child, childName ) {
			var childFn = cache[ child.resource ][ child.render ];
			var childItem = data[ childName ];
			var embed;
			var inheritedUrl = useHal ? ( resources[ child.resource ].parent ? body._links.self.href : "" ) : "";
			inheritedUrl = inheritedUrl.replace( urlPrefix, "" );
			var childRenderer = renderChild.bind( undefined, childFn, inheritedUrl );
			if ( _.isArray( childItem ) ) {
				embed = when.all( _.map( childItem, childRenderer ) );
			} else if ( childItem ) {
				embed = childRenderer( childItem );
			}
			if ( embed ) {
				embed.then( function( child ) {
					if ( !useHal || !_.isEmpty( child ) ) {
						eAcc[ childName ] = child;
					}
				} );
				promises.push( embed );
			}
			return promises;
		}, [] );

		return when.all( embedded ).then( function() {
			if ( !_.isEmpty( eAcc ) ) {
				if ( useHal ) {
					body._embedded = eAcc;
				} else {
					_.extend( body, eAcc );
				}
			}
			return body;
		} );
	}

	if ( !useHal ) {
		return when( body )
			.then( onBody );
	} else {
		return createLink( resourceName, actionName, envelope, data, parentUrl )
			.then( onLink )
			.then( onLinks )
			.then( onBody );
	}
}

module.exports = {
	bodyGenerator: getBodyGenerator,
	optionsGenerator: getOptionGenerator,
	routesGenerator: getRouteGenerator,
	renderGenerator: getRenderGenerator,
	resourceGenerator: getResourceGenerator,
	resourcesGenerator: getResourcesGenerator
};
