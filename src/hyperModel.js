var url = require( "../src/urlTemplate.js" );
var plural = require( "plural" );
var _ = require( "lodash" );
var options;

function addEmbedded( hypermodel, auth, resources, version, prefix, action, model ) {
	var embedded = getEmbedded( auth, resources, version, prefix, action, model, hypermodel._links.self ? hypermodel._links.self.href : "" );
	if( embedded ) {
		hypermodel._embedded = embedded;
	}
}

function addLinks( hypermodel, auth, model, prefix, resource, view, parentUrl ) {
	var links = getLinks( auth, model, prefix, resource, view, parentUrl );
	if( links ) {
		hypermodel._links = links;
	}
}

function addOrigin( hypermodel, resources, resourceName, resource, action, model, prefix, parentUrl ) {
	parentUrl = ( resource.parent && ( !parentUrl || isTemplated( parentUrl ) ) ) ? buildParentUrl( resources, resource.parent, model ) : parentUrl;
	var origin = [ url.create( action.url, model, resourceName ) ];
	if( parentUrl && resource.parent ) {
		origin.unshift( parentUrl );
	} else {
		origin.unshift( prefix );
	}
	hypermodel._origin = { href: origin.join( "" ), method: action.method.toUpperCase() };
	if( isTemplated( origin ) ) {
		hypermodel._origin.templated = true;
	}
}

function applyVersion( resource, version ) {
	var target = _.cloneDeep( resource );
	version = version || 1;
	if( resource.versions && version > 1 ) {
		var changes = _.filter( resource.versions, function( x, v ) { return v <= version; } );
		_.each( changes, function( change ) {
			deepMerge( target.actions, change );
		} );
	}
	target.actions = _.omit( target.actions, function( x ) { return x.deleted; } );
	return target;
}

function buildParentUrl( resources, parent, model ) { // jshint ignore:line
	var resource = resources[ parent ];
	var self = resource.actions.self.url;
	var tokens = url.getTokens( self );
	if( tokens.length > 0 ) {
		var values = {};
		if( model && model[ parent ] ) {
			_.each( tokens, function( token ) {
				values[ token.property ] = model[ parent ][ token.property ];
			} );
		} else {
			_.each( tokens, function( token ) {
				token.resource = parent;
				var property = url.toCamel( token );
				if( model && model[ property ] ) {
					token.resource = undefined;
					values[ token.property ] = model[ property ];
				}
			} );
		}
		self = url.create( self, values, parent );
	}
	return self;
}

function deepMerge( target, source ) { // jshint ignore:line
	_.each( source, function( val, key ) {
		var original = target[ key ];
		if( _.isObject( val ) ) {
			if( original ) { deepMerge( original, val ); }
			else { target[ key ] = val; }
		} else {
			 target[ key ] = ( original === undefined ) ? val : original;
		}
	} );
}

function filterProperties ( model, action ) {
	var include = action.include;
	var filter = action.filter;
	var exclude = action.exclude;
	var map = action.transform;
	var embeddedProperties = _.keys( action.embed );

	var filtered;
	if( map ) {
		filtered = map( model );
	} else if( include ) {
		embeddedProperties = _.difference( embeddedProperties, include );
		filtered = _.pick( model, include );
	} else if ( exclude ) {
		filtered = _.omit( model, exclude );
	} else {
		filtered = _.cloneDeep( model );
	}
	if( filter ) {
		filtered = _.pick( filtered, filter );
	}
	filtered = _.omit( filtered, embeddedProperties );
	return filtered;
}

function getEmbedded( auth, resources, version, prefix, action, model, parentPath ) { // jshint ignore:line
	var embed = action.embed;
	var embedded;

	if( embed && model ) {
		embedded = {};
		_.each( embed, function( opts, property ) {
			var child = model[ property ];
			var resourceName = opts.resource;
			if( _.isArray( child ) ) {
				embedded[ property ] = _.map( child, function( item ) {
					return generate( resources, version, prefix, item, resourceName, opts.render, auth, parentPath );
				} );
			} else {
				embedded[ property ] = generate( resources, version, prefix, child, resourceName, opts.render, auth, parentPath );
			}
		} );
	}

	return embedded;
}

function getLinks( auth, model, prefix, resource, view, parentPath ) { // jshint ignore:line
	var links;
	if( resource.actions ) {
		links = {};
		_.each( resource.actions, function( action, rel ) {
			var hasPermission = !auth || auth( resource.name + "." + rel );
			var canRender = action.condition ? action.condition( model ) : true;
			if( hasPermission && canRender ) {
				var href = [ url.create( action.url, model, resource.name ) ];
				var option = !model;
				var inherit = resource.parent !== undefined;
				if( inherit ) {
					href.unshift( parentPath );
				} else {
					href.unshift( prefix );
				}
				href = href.join( "" );
				var templated = isTemplated( href );
				var valid = ( option && !inherit && templated ) || ( !option );
				if( valid ) {
					links[ rel ] = {
						href: href, method: action.method.toUpperCase()
					};
					if( templated ) {
						links[ rel ].templated = true;
					}
				}
			}
		} );
	}
	return links;
}

function generate( resources, version, prefix, model, resourceName, view, auth, parentUrl ) { // jshint ignore:line
	if( !resourceName ) {
		return generateOptions(resources, version, prefix, model, auth );
	} else if( _.isArray( model ) ) {
		return generateCollection( resources, version, prefix, model, resourceName, view, auth, parentUrl );
	} else {
		return generateResource( resources, version, prefix, model, resourceName, view, auth, parentUrl );
	}
}

function generateCollection( resources, version, prefix, collection, resourceName, view, auth, parentUrl ) { // jshint ignore:line
	var resource = resources[ resourceName ];
	var action = resource.actions[ view ];
	var list = _.map( collection, function( model ) {
		return generateResource( resources, version, prefix, model, resourceName, view, parentUrl );
	} );
	var hypermodel = {};
	var origin = url.create( action.url, hypermodel, resourceName );
	hypermodel._origin = { href: origin, method: action.method.toUpperCase() };
	hypermodel[ plural( resourceName ) ] = list;
	return hypermodel;
}

// TODO: use auth (if available) to filter actions in options as well
function generateOptions( resources, version, prefix, engines, auth ) { // jshint ignore:line
	if( !options ) {
		options = _.reduce( resources, function( options, resource, resourceName ) {
			var parentUrl = resource.parent ? resources[ resource.parent ].actions.self.url : undefined;
			options[ resourceName ] = _.reduce( resource.actions, function( links, action, actionName ) {
				var urlSegments = [ action.url ];
				if( parentUrl ) {
					urlSegments.unshift( parentUrl );
				}
				if( prefix ) {
					urlSegments.unshift( prefix );
				}
				var link = { href: url.create( urlSegments.join( "" ) ), method: action.method.toUpperCase() };
				if( isTemplated( action.url ) ) {
					link.templated = true;
				}
				links[ actionName ] = link;
				return links;
			}, {} );
			options._versions = options._versions.concat( _.keys( resource.versions ) );
			return options;
		}, { _versions: [ "1" ] } );
		options._versions = _.unique( options._versions );
		options._mediaTypes = _.keys( engines );
	}
	return options;
}

function generateResource( resources, version, prefix, model, resourceName, view, auth, parentUrl ) { // jshint ignore:line
	var resource = resources[ resourceName ];
	if( !resource ) {
		throw new Error( "Could not find resource '" + resourceName + "'" );
	}
	resource = applyVersion( resource, version );
	var action = resource.actions[ view ];
	if( !action ) {
		throw new Error( "Could not find action '" + view + "' for resource '" + resourceName + "'");
	}
	var hypermodel = filterProperties( model, action );
	addOrigin( hypermodel, resources, resourceName, resource, action, model, prefix, parentUrl );
	addLinks( hypermodel, auth, model, prefix, resource, view, parentUrl );
	addEmbedded( hypermodel, auth, resources, version, prefix, action, model );
	
	return hypermodel;
}

function isTemplated( url ) { // jshint ignore:line
	return url.indexOf( ":" ) > 0;
}

module.exports = function( resources, version, prefix ) {
	return generate.bind( null, resources, version, prefix );
};