var _ = require( "lodash" );
var url = require( "./urlTemplate.js" );
var plural = require( "plural" );
var options;

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

function buildParentUrl( resources, parent, model, prefix ) { // jshint ignore:line
	var self = "";
	if( parent && resources[ parent ] ) {
		var resource = resources[ parent ];
		self = ( prefix || "" ) + resource.actions.self.url;
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

function getOptions( resources, prefix, engines ) { // jshint ignore:line
	if( !options ) {
		var linkList = {};

		options = _.reduce( resources, function( opts, resource, resourceName ) {
			var parentUrl = resource.parent ? resources[ resource.parent ].actions.self.url : undefined;
			_.reduce( resource.actions, function( links, action, actionName ) {
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
				links[ [ resourceName, actionName ].join( ":" ) ] = link;
				return links;
			}, linkList );
			opts._versions = opts._versions.concat( _.keys( resource.versions ) );
			return opts;
		}, { _versions: [ "1" ] } );

		options._links = linkList;
		options._versions = _.unique( options._versions );
		options._mediaTypes = _.keys( engines );
	}
	return options;
}

function isTemplated( url ) { // jshint ignore:line
	return url.indexOf( "{" ) > 0 || url.indexOf( ":") > 0;
}

function initialize( resources, version, prefix ) {
	options = undefined;
	return function( model, resourceName, actionName ) {
		var parentUrl, authorize, filtered;
		var originResourceName = resourceName;
		var originActionName = actionName;
		var originResource = resources[ originResourceName ];
		var originAction = originResource ? originResource.actions[ originActionName ] : undefined;
		var resource = ( resources[ resourceName ] ) ? applyVersion( resources[ resourceName ], version ) : undefined;
		var action = resource ? resource.actions[ actionName ] : undefined;
		
		if( resourceName && !resource ) {
			throw new Error( "Could not find resource '" + resourceName + "'" );
		}

		if( actionName && !action ) {
			throw new Error( "Could not find action '" + actionName + "' for resource '" + resourceName + "'" );
		}

		if( model ) {
			filtered = action ? filterProperties( model, action ) : undefined;
			parentUrl = parentUrl || resource ? buildParentUrl( resources, resource.parent, model, prefix ) : "";
		}

		return {
			auth: function( auth ) {
				authorize = auth;
				return this;
			},
			getEmbedded: function( item, _parentUrl ) {
				item = item || model;
				var embed = action.embed;
				var embedded;

				if( embed && item ) {
					embedded = {};
					_.each( embed, function( opts, property ) {
						var child = item[ property ];
						var resourceName = opts.resource;
						if( _.isArray( child ) ) {
							var fn = initialize( resources, version, prefix );
							embedded[ property ] = _.map( child, function( item ) {
								return fn( item, resourceName, opts.render ).auth( authorize ).parentUrl( _parentUrl ).render();
							} );
						} else {
							embedded[ property ] = initialize( resources, version, prefix )( child, resourceName, opts.render ).auth( authorize ).parentUrl( _parentUrl ).render();
						}
					} );
				}

				return embedded;
			},
			getLinks: function( item ) { // jshint ignore:line
				item = item || model;
				var links;
				if( resource.actions ) {
					links = {};
					_.each( resource.actions, function( action, rel ) {
						var hasPermission = !authorize || authorize( resource.name + "." + rel );
						var canRender = action.condition ? action.condition( item ) : true;
						if( hasPermission && canRender ) {
							var href = [ url.create( action.url, item, resource.name ) ];
							var option = !item;
							var inherit = resource.parent !== undefined;
							if( inherit ) {
								href.unshift( parentUrl );
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
			},
			getOrigin: function( item ) {
				item = item || model;
				var origin = [ url.create( originAction.url, item, originResourceName ) ];
				if( parentUrl && resource.parent ) {
					origin.unshift( parentUrl );
				} else {
					origin.unshift( prefix );
				}
				var link = { href: origin.join( "" ), method: action.method.toUpperCase() };
				if( isTemplated( link.href ) ) {
					link.templated = true;
				}
				return link;
			},
			originalResource: function( name ) {
				originResourceName = name;
				originResource = resources[ originResourceName ];
				return this;
			},
			parentUrl: function( url ) {
				parentUrl = url;
				return this;
			},
			render: function() {
				if( !resource ) {
					return this.renderOptions();
				} else if ( _.isArray( model ) ) {
					return this.renderResources();
				} else {
					return this.renderResource();
				}
			},
			renderOptions: function() {
				return getOptions( resources, prefix, model );
			},
			renderResource: function( item ) {
				if( item ) {
					filtered = action ? filterProperties( item, action ) : undefined;
				}
				var hyperModel = filtered;
				hyperModel._origin = this.getOrigin( item );
				hyperModel._links = this.getLinks( item );
				hyperModel._embedded = this.getEmbedded( item, hyperModel._links.self.href );
				return _.omit( hyperModel, function( val ) { return val === undefined; } );
			},
			renderResources: function() {
				var hyperModel = {};

				var fn = initialize( resources, version, prefix );
				var list = _.map( model, function( item ) {
					return fn( item, resourceName, actionName ).auth( authorize ).render();
				} );
				hyperModel._origin = this.getOrigin( model[ 0 ] );
				hyperModel[ plural( resourceName ) ] = list;
				return hyperModel;
			},
			useAction: function( name ) {
				if( name ) {
					actionName = name;
					action = resources[ resourceName ].actions[ name ];
				}
				return this;
			},
			useResource: function( name ) {
				if( name ) {
					resourceName = name;
					resource = resources[ resourceName ];
				}
				return this;
			}
		};
	};
}

module.exports = initialize;