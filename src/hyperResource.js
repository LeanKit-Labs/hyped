var _ = require( "lodash" );
var url = require( "./urlTemplate.js" );
var pluralize = require( "pluralize" );

function applyVersion( resource, version ) {
	var target = _.cloneDeep( resource );
	version = version || 1;
	if ( resource.versions && version > 1 ) {
		var changes = _.filter( resource.versions, function( x, v ) {
			return v <= version;
		} );
		_.each( changes, function( change ) {
			deepMerge( target.actions, change );
		} );
	}
	target.actions = _.omit( target.actions, function( x ) {
		return x.deleted;
	} );
	return target;
}

function deepMerge( target, source ) { // jshint ignore:line
	_.each( source, function( val, key ) {
		var original = target[ key ];
		if ( _.isObject( val ) ) {
			if ( original ) {
				deepMerge( original, val );
			} else {
				target[ key ] = val;
			}
		} else {
			target[ key ] = ( original === undefined ) ? val : original;
		}
	} );
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

function buildParametersFn( action ) {
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
	return function getParameters( data, context ) {
		return _.reduce( generators, function( acc, fn, key ) {
			var param = fn( data, context );
			if ( param ) {
				acc[ key ] = param;
			}
			return acc;
		}, parameters );
	};
}

function isTemplated( url ) { // jshint ignore:line
	return url.indexOf( "{" ) > 0 || url.indexOf( ":" ) > 0;
}

function getActionUrlCache( resources, prefix, version ) {
	var cache = {};
	var parentUrlFn = getParentUrlFn( resources, prefix, version );

	_.reduce( resources, function( rAcc, resource, resourceName ) {
		resource = getVersion( resource, version );
		rAcc[ resourceName ] = _.reduce( resource.actions, function( acc, action, actionName ) {
			var actionUrl = [ resource.urlPrefix, resource.actions[ actionName ].url ].join( "" );
			var templated = isTemplated( actionUrl );
			var getActionUrl = function() {
				return actionUrl;
			};
			if ( templated ) {
				var tokens = url.getTokens( actionUrl );
				var halUrl = url.forHal( actionUrl );
				getActionUrl = function( data ) {
					var clonedTokens = _.clone( tokens );
					return url.process( clonedTokens, halUrl, data, resourceName );
				};
			}

			function getPrefix( parentUrl, data ) {
				return ( parentUrl || parentUrlFn( resourceName, data ) ) || prefix;
			}

			acc[ actionName ] = function( data, parentUrl ) {
				var href = [
					getPrefix( parentUrl, data ),
					getActionUrl( data )
				].join( "" );
				return href;
			};

			_.each( action.links, function( link, linkName ) {
				var linkFn = getLinkFn( link, resource, resourceName );
				acc[ linkName ] = function( data, parentUrl, context ) {
					var href = [
						getPrefix( parentUrl, data ),
						linkFn( data, context )
					].join( "" );
					return href;
				};
			} );

			return acc;
		}, {} );
		return rAcc;
	}, cache );

	return cache;
}

function getBodyCache( resources, prefix, version ) {
	var cache = {};
	_.reduce( resources, function( rAcc, resource, resourceName ) {
		resource = getVersion( resource, version );
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

function getBodyFn( resources, prefix, version ) {
	var renderCache = getBodyCache( resources, prefix, version );
	return function( resourceName, actionName, data ) {
		return renderCache[ resourceName ][ actionName ]( data );
	};
}

function getLinksCache( resources, prefix, version, forOptions ) {
	var cache = {};
	var urlFn = getUrlFn( resources, prefix, version );

	_.reduce( resources, function( rAcc, resource, resourceName ) {
		resource = getVersion( resource, version );
		rAcc[ resourceName ] = _.reduce( resource.actions, function( acc, action, actionName ) {
			var parameterFn = buildParametersFn( action );
			var method = action.method.toUpperCase();
			var render = shouldRenderFn( action, actionName, resourceName, forOptions );
			acc[ actionName ] = function( data, parentUrl, context, auth ) {
				var links = {};
				if ( render( data, context, auth ) ) {
					var actionUrl = urlFn( resourceName, actionName, data, parentUrl, context );
					var parameters = parameterFn( data, context );
					_.each( action.links, function( _link, linkName ) {
						var linkUrl = urlFn( resourceName, linkName, data, parentUrl, context );
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
				} else {
					return links;
				}
			};
			return acc;
		}, {} );
		return rAcc;
	}, cache );
	return cache;
}

function getLinksFn( resources, prefix, version, forOptions ) {
	var linkCache = getLinksCache( resources, prefix, version, forOptions );
	return function( resourceName, actionName, data, parentUrl, context, auth ) {
		auth = auth || function() {
			return true;
		};
		return linkCache[ resourceName ][ actionName ]( data, parentUrl, context, auth );
	};
}

function getLinkFn( link, resource, resourceName ) { // jshint ignore:line
	if ( _.isFunction( link ) ) {
		return function( data, context ) {
			var linkUrl = link( data, context );
			if ( linkUrl ) {
				linkUrl = [ resource.urlPrefix, linkUrl ].join( "" );
				return isTemplated( linkUrl ) ?
					url.create( linkUrl, data, resourceName ) :
					linkUrl;
			} else {
				return undefined;
			}
		};
	} else {
		var halUrl = url.forHal( [ resource.urlPrefix, link ].join( "" ) );
		var templated = isTemplated( halUrl );
		if ( templated ) {
			var tokens = url.getTokens( halUrl );
			return function( data ) {
				return url.process( _.cloneDeep( tokens ), halUrl, data, resourceName );
			};
		}
	}
}

function getOptionCache( resources, prefix, version, excludeChildren ) {
	var linkFn = getLinksFn( resources, prefix, version, true );
	var options = { _links: {} };
	var versions = [ "1" ];
	_.reduce( resources, function( rAcc, resource, resourceName ) {
		versions = versions.concat( resource.versions ? _.keys( resource.versions ) : [] );
		resource = getVersion( resource, version );
		_.each( resource.actions, function( action, actionName ) {
			if ( ( excludeChildren && !resource.parent ) || !excludeChildren ) {
				var main = linkFn( resourceName, actionName, undefined, undefined, undefined );
				if ( !_.isEmpty( main ) ) {
					options._links[ [ resourceName, actionName ].join( ":" ) ] = _.values( main )[ 0 ];
				}
				_.each( resource.actions, function( link, linkName ) {
					var additional = _.values( linkFn( resourceName, linkName, undefined, undefined, undefined ) )[ 0 ];
					if ( !_.isEmpty( additional ) ) {
						options._links[ [ resourceName, linkName ].join( ":" ) ] = additional;
					}
				} );
			}
		} );
		return rAcc;
	}, options );
	options._versions = _.unique( versions );
	return options;
}

function getOptionsFn( resources, prefix, version, excludeChildren ) {
	var options = getOptionCache( resources, prefix, version, excludeChildren );
	return function( data ) {
		options._mediaTypes = _.keys( data );
		return options;
	};
}

function getOriginCache( resources, prefix, version ) {
	var cache = {};
	var urlFn = getUrlFn( resources, prefix, version );

	_.reduce( resources, function( rAcc, resource, resourceName ) {
		resource = getVersion( resource, version );
		rAcc[ resourceName ] = _.reduce( resource.actions, function( acc, action, actionName ) {
			var method = action.method.toUpperCase();
			acc[ actionName ] = function( data, parentUrl, context, auth ) {
				var actionUrl = urlFn( resourceName, actionName, data, parentUrl, context );
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
	return function( resourceName, actionName, data, parentUrl ) {
		return originCache[ resourceName ][ actionName ]( data, parentUrl );
	};
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
		var tokens = [],
			segments = [];
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
		v = getVersion( v, version );
		var meta = visitParent( k );
		var segments = meta.segments;
		var tokens = meta.tokens;
		var joined = segments.join( "" );
		acc[ k ] = {
			url: joined,
			tokens: tokens
		};
		return acc;
	}, cache );

	return cache;
}

function getParentUrlFn( resources, prefix, version ) { // jshint ignore:line
	var cache = getParentUrlCache( resources );

	return function( resourceName, data ) {
		var meta = cache[ resourceName ];
		var tokens = _.clone( meta.tokens );
		var parentUrl = [ prefix, meta.url ].join( "" );
		var values = _.reduce( tokens, function( acc, token ) {
			var val = url.readToken( resourceName, data, token );
			acc[ token.property ] = acc[ token.camel ] = val;
			return acc;
		}, {} );
		return url.process( tokens, parentUrl, values, resourceName );
	};
}

function getRenderFn( resources, prefix, version ) {
	var resourceFn = getResourceFn( resources, prefix, version );
	var resourcesFn = getResourcesFn( resources, prefix, version );

	return function( resourceName, actionName, data, parentUrl, context, originUrl, originMethod, authCheck ) {
		if ( _.isArray( data ) ) {
			return resourcesFn( resourceName, actionName, data, parentUrl, context, originUrl, originMethod, authCheck );
		} else {
			return resourceFn( resourceName, actionName, data, parentUrl, context, originUrl, originMethod, authCheck );
		}
	};
}

function getResourceCache( resources, prefix, version ) {
	var cache = {};
	var renderFn = getBodyFn( resources, prefix, version );
	var linkFn = getLinksFn( resources, prefix, version );

	_.reduce( resources, function( rAcc, resource, resourceName ) {
		resource = getVersion( resource, version );
		rAcc[ resourceName ] = _.reduce( resource.actions, function( acc, action, actionName ) {
			acc[ actionName ] = function( data, parentUrl, context, originUrl, originMethod, auth ) {
				var body = renderFn( resourceName, actionName, data );
				var main = linkFn( resourceName, actionName, data, parentUrl, context, auth );
				var origin = ( originUrl && originMethod ) ?
					{ href: originUrl, method: originMethod } :
					main[ actionName ];
				_.each( resource.actions, function( link, linkName ) {
					_.defaults( main, linkFn( resourceName, linkName, data, parentUrl, context, auth ) );
				} );
				body._links = main;
				body._origin = origin;
				body._resource = resourceName;
				body._action = actionName;
				var embedded = _.reduce( action.embed, function( eAcc, child, childName ) {
					var childFn = cache[ child.resource ][ child.render ];
					var childVal = data[ childName ];
					var embed;
					var inheritedUrl = resources[ child.resource ].parent ? body._links.self.href : "";
					if ( _.isArray( childVal ) ) {
						embed = _.map( childVal, function( x ) {
							var item = childFn( x, inheritedUrl, context );
							if ( child.actions ) {
								item._links = _.pick( item._links, child.actions );
							}
							return item;
						} );
					} else if ( childVal ) {
						embed = childFn( childVal, inheritedUrl, context );
						if ( child.actions ) {
							embed._links = _.pick( embed._links, child.actions );
						}
					}
					if ( !_.isEmpty( embed ) ) {
						eAcc[ childName ] = embed;
					}
					return eAcc;
				}, {} );
				if ( !_.isEmpty( embedded ) ) {
					body._embedded = embedded;
				}
				return body;
			};
			return acc;
		}, {} );
		return rAcc;
	}, cache );

	return cache;
}

function getResourceFn( resources, prefix, version ) { // jshint ignore:line
	var resourceCache = getResourceCache( resources, prefix, version );
	return function( resourceName, actionName, data, parentUrl, context, originUrl, originMethod, auth ) {
		return resourceCache[ resourceName ][ actionName ]( data, parentUrl, context, originUrl, originMethod, auth );
	};
}

function getResourcesFn( resources, prefix, version ) { // jshint ignore:line
	var resourceCache = getResourceCache( resources, prefix, version );
	var originFn = getOriginFn( resources, prefix, version );

	return function( resourceName, actionName, data, parentUrl, context, originUrl, originMethod, auth ) {
		var body = {};
		var resource = getVersion( resources[ resourceName ], version );
		var render = resource.actions[ actionName ].render;
		var items = render ? pluralize.plural( render.resource ) : pluralize.plural( resourceName );
		var list = _.map( data, function( item ) {
			if ( render ) {
				return resourceCache[ render.resource ][ render.action ]( item, parentUrl );
			} else {
				return resourceCache[ resourceName ][ actionName ]( item, parentUrl );
			}
		} );
		if ( originUrl && originMethod ) {
			body._origin = { href: originUrl, method: originMethod };
		} else {
			body._origin = originFn( resourceName, actionName, data[ 0 ], parentUrl );
		}
		body[ items ] = list;
		return body;
	};
}

function getVersion( resource, version ) { // jshint ignore:line
	if ( version === undefined ) {
		return resource;
	} else {
		return getVersions( resource )[ version ] || resource;
	}
}

function getVersions( resource ) { // jshint ignore:line
	var versions = { 1: resource };
	_.each( resource.versions, function( versionSpec, version ) {
		versions[ version ] = applyVersion( resource, version );
	} );
	return versions;
}

function getUrlFn( resources, prefix, version ) { // jshint ignore:line
	var cache = getActionUrlCache( resources, prefix, version );
	return function( resourceName, actionName, data, parentUrl, context ) {
		return cache[ resourceName ][ actionName ]( data, parentUrl, context );
	};
}

function removeEmbedded( embedded, unit ) { // jshint ignore:line
	return embedded ? function( data ) {
		return _.omit( data, embedded );
	} : unit;
}

function shouldRenderFn( action, actionName, resourceName, forOptions ) { // jshint ignore:line
	var canRender;
	if ( action.condition && !forOptions ) {
		canRender = function canRender( data, context ) {
			return action.condition( data || {}, context );
		};
	} else {
		canRender = function canRender() {
			return true;
		};
	}
	var authName = [ resourceName, actionName ].join( ":" );
	return function( data, context, auth ) {
		return ( canRender( data, context ) && auth( authName, data, context ) );
	};
}

module.exports = {
	bodyFn: getBodyFn,
	linkFn: getLinksFn,
	optionsFn: getOptionsFn,
	parentFn: getParentUrlFn,
	renderFn: getRenderFn,
	resourceFn: getResourceFn,
	resourcesFn: getResourcesFn,
	urlFn: getUrlFn,
	urlCache: getParentUrlCache,
	versionsFor: getVersions
};
