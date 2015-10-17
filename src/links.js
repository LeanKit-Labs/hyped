var _ = require( "lodash" );
var when = require( "when" );
var url = require( "./urlTemplate" );
var versions = require( "./versions" );
var whenFn = require( "when/function" );

function actionLinkGenerator( state, envelope, data, parentUrl, auth ) {
	var action = state.action;
	var actionName = state.actionName;
	var createUrl = state.createUrl;
	var getParameters = state.getParameters;
	var method = state.method;
	var render = state.render;
	var resourceName = state.resourceName;

	function onRender( shouldRender ) {
		var links = {};
		if ( shouldRender ) {
			var actionUrl = createUrl( resourceName, actionName, data, parentUrl, envelope );
			var parameters = getParameters( data, envelope );
			_.each( action.links, function( _link, linkName ) {
				var linkUrl = createUrl( resourceName, linkName, data, parentUrl, envelope );
				if ( linkUrl ) {
					var link = {
						href: linkUrl,
						method: method
					};
					if ( isTemplated( linkUrl ) ) {
						link.templated = true;
					}
					if ( action.parameters ) {
						link.parameters = parameters;
					}
					links[ linkName ] = link;
				}
			} );
			var link = { href: actionUrl, method: method };
			links[ actionName ] = link;
			if ( isTemplated( actionUrl ) ) {
				link.templated = true;
			}
			if ( action.parameters ) {
				link.parameters = parameters;
			}
		}
		return links;
	}

	return render( envelope, data, auth )
		.then( onRender );
}

function actionRouteGenerator( state, envelope, data, parentUrl ) {
	var action = state.action;
	var actionName = state.actionName;
	var createUrl = state.createUrl;
	var getParameters = state.getParameters;
	var method = state.method;
	var resourceName = state.resourceName;
	var links = {};
	var actionUrl = createUrl( resourceName, actionName, data, parentUrl, envelope );
	var parameters = getParameters( data, envelope );
	_.each( action.links, function( _link, linkName ) {
		var linkUrl = createUrl( resourceName, linkName, data, parentUrl, envelope );
		if ( linkUrl ) {
			var link = {
				href: linkUrl,
				method: method
			};
			if ( isTemplated( linkUrl ) ) {
				link.templated = true;
			}
			if ( action.parameters ) {
				link.parameters = parameters;
			}
			links[ linkName ] = link;
		}
	} );
	var link = { href: actionUrl, method: method };
	links[ actionName ] = link;
	if ( isTemplated( actionUrl ) ) {
		link.templated = true;
	}
	if ( action.parameters ) {
		link.parameters = parameters;
	}
	return links;
}

function canAndShould( can, should ) {
	return can && should;
}

function getActionUrlCache( resources, prefix, version ) {
	var cache = {};
	var parentUrlFn = getParentUrlGenerator( resources, version );
	var prefixFn = getPrefix.bind( undefined, resources, prefix );

	_.reduce( resources, function( rAcc, resource, resourceName ) {
		resource = versions.getVersion( resource, version );
		rAcc[ resourceName ] = _.reduce( resource.actions, function( acc, action, actionName ) {
			var actionSegment = resource.actions[ actionName ].url;
			var resourceSegment = getResourcePrefix( actionSegment, resource, resourceName );
			var actionUrl = [ resourceSegment, actionSegment ].join( "" ).replace( "//", "/" );
			var templated = isTemplated( actionUrl );
			var getActionUrl = function() {
				return actionUrl;
			};
			if ( templated ) {
				var tokens = url.getTokens( actionUrl );
				var halUrl = url.forHal( actionUrl );
				getActionUrl = function( data, envelope ) {
					var clonedTokens = _.clone( tokens );
					return url.process( clonedTokens, halUrl, data, envelope, resourceName );
				};
			}

			function getParentUrl( parentUrl, data, envelope ) {
				return ( parentUrl || parentUrlFn( resourceName, data, envelope ) ) || "";
			}

			var resourcePrefix = prefixFn( resource );

			acc[ actionName ] = function( data, parentUrl, envelope ) {
				var href = [
					resourcePrefix.urlPrefix,
					resourcePrefix.apiPrefix,
					getParentUrl( parentUrl, data, envelope ),
					getActionUrl( data, envelope )
				].join( "" ).replace( "//", "/" );
				return href;
			};

			_.each( action.links, function( link, linkName ) {
				var linkFn = getLinkFactory( link, resource, resourceName );
				acc[ linkName ] = function( data, parentUrl, envelope ) {
					var linkUrl = linkFn( data, envelope );
					if ( linkUrl ) {
						var href = [
							resourcePrefix.urlPrefix,
							resourcePrefix.apiPrefix,
							getParentUrl( parentUrl, data ),
							linkFn( data, envelope )
						].join( "" ).replace( "//", "/" );
						return href;
					} else {
						return "";
					}
				};
			} );
			return acc;
		}, {} );
		return rAcc;
	}, cache );

	return cache;
}

function getLinksCache( resources, prefix, version, forOptions, skipAuthCheck ) {
	var cache = {};
	var createUrl = getUrlGenerator( resources, prefix, version );

	_.reduce( resources, function( rAcc, resource, resourceName ) {
		resource = versions.getVersion( resource, version );
		rAcc[ resourceName ] = _.reduce( resource.actions, function( acc, action, actionName ) {
			var getParameters = buildParametersGenerator( action );
			var method = action.method.toUpperCase();
			var render;
			if ( skipAuthCheck ) {
				render = function() {
					return when.resolve( true );
				};
			} else {
				render = getRenderPredicate( action, actionName, resourceName, forOptions );
			}
			acc[ actionName ] = actionLinkGenerator.bind( undefined, {
				action: action,
				actionName: actionName,
				createUrl: createUrl,
				getParameters: getParameters,
				method: method,
				render: render,
				resourceName: resourceName
			} );
			return acc;
		}, {} );
		return rAcc;
	}, cache );
	return cache;
}

function getLinkFactory( link, resource, resourceName ) { // jshint ignore:line
	if ( _.isFunction( link ) ) {
		return function( data, envelope ) {
			var linkUrl = link( envelope, data );
			if ( linkUrl ) {
				linkUrl = linkUrl.replace( "//", "/" );
				return isTemplated( linkUrl ) ?
					url.create( linkUrl, data, envelope, resourceName ) :
					linkUrl;
			} else {
				return undefined;
			}
		};
	} else {
		var halUrl = url.forHal( link.replace( "//", "/" ) );
		var templated = isTemplated( halUrl );
		if ( templated ) {
			var tokens = url.getTokens( halUrl );
			return function( data ) {
				return url.process( _.cloneDeep( tokens ), halUrl, data, {}, resourceName );
			};
		}
	}
}

function getLinkGenerator( resources, prefix, version, forOptions, skipAuthCheck ) {
	var linkCache = getLinksCache( resources, prefix, version, forOptions, skipAuthCheck );
	return function( resourceName, actionName, envelope, data, parentUrl, auth ) {
		auth = auth || function() {
			return true;
		};
		return linkCache[ resourceName ][ actionName ]( envelope, data, parentUrl, auth );
	};
}

function buildParametersGenerator( action ) {
	// get static parameters
	var parameters = _.reduce(
		_.omit( action.parameters, function( v ) {
			return _.isFunction( v );
		} ), function( acc, v, k ) {
			acc[ k ] = v;
			return acc;
		},
		{}
	);

	// get dynamic parameters
	var generators = _.omit( action.parameters, function( v ) {
		return !_.isFunction( v );
	} );

	// return a function that will add dynamic parameters to the
	// static at render time
	return getParametersFactory.bind( undefined, parameters, generators );
}

function getParametersFactory( parameters, generators, data, envelope ) {
	return _.reduce( generators, function( acc, fn, key ) {
		var param = fn( envelope, data );
		if ( param ) {
			acc[ key ] = param;
		}
		return acc;
	}, parameters );
}

function getParentTokens( parentUrl, resource ) {
	var templatedParent = isTemplated( parentUrl );
	if ( templatedParent ) {
		var tokens = _.map( url.getTokens( parentUrl ), function( token ) {
			token.resource = resource.parent;
			token.camel = url.toCamel( token );
			return token;
		} );
		return tokens;
	} else {
		return [];
	}
}

function getParentUrlCache( resources, version ) {
	var cache = {};

	function visitParent( name ) {
		var parentName = resources[ name ].parent;
		var tokens = [];
		var segments = [];
		if ( parentName ) {
			var parent = resources[ parentName ];
			var parentUrl = url.forHal( parent.actions.self.url );
			if ( parentUrl ) {
				segments.push( parentUrl );
				tokens = getParentTokens( parentUrl, resources[ name ] );
				if ( parent.parent ) {
					var child = visitParent( parentName );
					segments = child.segments.concat( segments );
					tokens = child.tokens.concat( tokens );
				}
			}
		}
		return {
			segments: segments,
			tokens: tokens
		};
	}

	cache = _.reduce( resources, function( acc, v, k ) {
		v = versions.getVersion( v, version );
		var meta = visitParent( k );
		var segments = meta.segments;
		var tokens = meta.tokens;
		var joined = segments.join( "" ).replace( "//", "/" );
		acc[ k ] = {
			url: joined,
			tokens: tokens
		};
		return acc;
	}, cache );

	return cache;
}

function getParentUrlGenerator( resources, version ) { // jshint ignore:line
	var cache = getParentUrlCache( resources );
	return function( resourceName, data, envelope ) {
		var meta = cache[ resourceName ];
		var tokens = _.clone( meta.tokens );
		var parent = resources[ resourceName ].parent;
		var resourceSegment = getResourcePrefix( meta.url, resources[ parent ], parent );
		var parentUrl = [ resourceSegment, meta.url ].join( "" ).replace( "//", "/" );
		var values = _.reduce( tokens, function( acc, token ) {
			var val = url.readToken( resourceName, data, envelope, token );
			acc[ token.property ] = acc[ token.camel ] = val;
			return acc;
		}, {} );
		return url.process( tokens, parentUrl, values, envelope, resourceName );
	};
}

function getPrefix( resources, prefix, resource ) {
	var urlPrefix = prefix ? prefix.urlPrefix : "";
	var apiPrefix = prefix ? prefix.apiPrefix : "";
	var parentPrefix = {};

	if ( resource.parent ) {
		var parentResource = resources[ resource.parent ];
		parentPrefix = getPrefix( resources, prefix, parentResource );
	}

	if ( resource.urlPrefix === undefined ) {
		urlPrefix = parentPrefix.urlPrefix === undefined ? urlPrefix : parentPrefix.urlPrefix;
	} else {
		urlPrefix = resource.urlPrefix;
	}

	if ( resource.apiPrefix === undefined ) {
		apiPrefix = parentPrefix.apiPrefix === undefined ? apiPrefix : parentPrefix.apiPrefix;
	} else {
		apiPrefix = resource.apiPrefix;
	}

	return {
		urlPrefix: urlPrefix,
		apiPrefix: apiPrefix
	};
}

function getRenderPredicate( action, actionName, resourceName, forOptions ) { // jshint ignore:line
	var canRender, allowRender;
	if ( action.condition && !forOptions ) {
		canRender = function canRender( data, envelope ) {
			return action.condition( envelope, data || {} );
		};
	} else {
		canRender = function canRender() {
			return true;
		};
	}
	if ( action.authorize ) {
		allowRender = action.authorize;
	}
	var authName = [ resourceName, actionName ].join( ":" );
	return function( envelope, data, auth ) {
		var can = canRender( data, envelope );
		var should = allowRender ? allowRender( envelope, data || envelope.context ) : auth( authName, data, envelope.context );
		return whenFn.apply( canAndShould, [ can, should ] );
	};
}

function getResourcePrefix( url, resource, resourceName ) {
	if ( !resource || resource.resourcePrefix === false ) {
		return "";
	} else {
		var regex = new RegExp( "[\/]" + resourceName );
		return regex.test( url ) ? "" : "/" + resourceName;
	}
}

function getRoutesCache( resources, prefix, version ) {
	var cache = {};
	var createUrl = getUrlGenerator( resources, prefix, version );

	_.reduce( resources, function( rAcc, resource, resourceName ) {
		resource = versions.getVersion( resource, version );
		rAcc[ resourceName ] = _.reduce( resource.actions, function( acc, action, actionName ) {
			var getParameters = buildParametersGenerator( action );
			var method = action.method.toUpperCase();
			acc[ actionName ] = actionRouteGenerator.bind( undefined, {
				action: action,
				actionName: actionName,
				createUrl: createUrl,
				getParameters: getParameters,
				method: method,
				resourceName: resourceName
			} );
			return acc;
		}, {} );
		return rAcc;
	}, cache );
	return cache;
}

function getRouteGenerator( resources, prefix, version ) {
	var routeCache = getRoutesCache( resources, prefix, version );
	return function( resourceName, actionName, envelope, data, parentUrl ) {
		return routeCache[ resourceName ][ actionName ]( envelope, data, parentUrl );
	};
}

function getUrlGenerator( resources, prefix, version ) { // jshint ignore:line
	var cache = getActionUrlCache( resources, prefix, version );
	return function( resourceName, actionName, data, parentUrl, envelope ) {
		return cache[ resourceName ][ actionName ]( data, parentUrl, envelope );
	};
}

function isTemplated( url ) { // jshint ignore:line
	return url.indexOf( "{" ) > 0 || url.indexOf( ":" ) > 0;
}

module.exports = {
	getLinksCache: getLinksCache,
	getLinkGenerator: getLinkGenerator,
	getPrefix: getPrefix,
	getRoutesCache: getRoutesCache,
	getRouteGenerator: getRouteGenerator,
	getUrlCache: getActionUrlCache,
	getUrlGenerator: getUrlGenerator,
	getParentUrlCache: getParentUrlCache,
	getParentUrlGenerator: getParentUrlGenerator
};
