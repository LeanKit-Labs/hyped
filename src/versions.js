var _ = require( "lodash" );

function remap( versions ) {
	return _.map( versions, function( changeSet, version ) {
		return _.merge( {}, changeSet, { _version: parseInt( version ) } );
	} );
}

function filter( version, versions ) {
	return _.filter( versions, function( changeSet ) {
		return changeSet._version <= version;
	} );
}

function order( versions ) {
	return _.sortBy( versions, "_version" );
}

function clean( versions ) {
	return _.map( versions, function( x ) {
		return _.omit( x, "_version" );
	} );
}

function applyVersion( resource, version ) {
	var target = _.cloneDeep( resource );
	version = version || 1;
	if ( resource.versions && version > 1 ) {
		var fn = _.flow( remap, filter.bind( null, version ), order, clean );
		var changes = fn( resource.versions );
		_.each( changes, function( change ) {
			deepMerge( target.actions, change );
		} );
	}
	target.actions = _.omitBy( target.actions, function( x ) {
		return x.deleted;
	} );

	return target;
}

function deepMerge( target, source ) { // jshint ignore:line
	_.each( source, function( val, key ) {
		if ( key === "handle" ) {
			return;
		}
		var original = target[ key ];
		if ( _.isArray( val ) ) {
			target[ key ] = _.clone( val );
		} else if ( _.isObject( val ) ) {
			if ( original ) {
				deepMerge( original, val );
			} else {
				target[ key ] = _.clone( val );
			}
		} else {
			target[ key ] = ( val ) ? _.clone( val ) : original;
		}
	} );
}

function getVersion( resource, version ) { // jshint ignore:line
	if ( version === undefined ) {
		return resource;
	} else {
		var versions = getVersions( resource );
		version = parseInt( version );
		var match = versions[ version ];
		if ( !match ) {
			var list = _.keys( versions );
			var closest = _.findLast( list, function( x ) {
				return version > parseInt( x );
			} );
			match = versions[ closest ];
		}
		return match || resource;
	}
}

function getVersions( resource ) { // jshint ignore:line
	var versions = { 1: resource };
	_.each( resource.versions, function( versionSpec, version ) {
		versions[ version ] = applyVersion( resource, version );
	} );
	return versions;
}

function processHandles( resource ) {
	if ( resource.versions ) {
		_.each( resource.versions, function( change, version ) {
			version = parseInt( version );
			_.each( change, function( action, name ) {
				if ( action.handle ) {
					var targetAction = resource.actions[ name ];
					if ( !targetAction ) {
						resource.actions[ name ].handle = [];
					} else if ( !_.isArray( targetAction.handle ) ) {
						var original = targetAction.handle;
						resource.actions[ name ].handle = [
							{
								when: function() {
									return true;
								},
								then: original
							}
						];
					}
					resource.actions[ name ].handle.unshift( {
						when: function( envelope ) {
							return envelope.version >= version;
						},
						then: action.handle
					} );
				}
			} );
		} );
	}
}

function processAuthorize( resource ) {
	if ( resource.versions ) {
		_.each( resource.versions, function( change, version ) {
			version = parseInt( version );
			_.each( change, function( action, name ) {
				if ( action.authorize ) {
					var targetAction = resource.actions[ name ];
					if ( !targetAction ) {
						resource.actions[ name ].authorize = [];
					} else if ( !_.isArray( targetAction.authorize ) ) {
						var original = targetAction.authorize;
						resource.actions[ name ].authorize = [
							{
								when: function() {
									return true;
								},
								then: original
							}
						];
					}
					resource.actions[ name ].authorize.unshift( {
						when: function( envelope ) {
							return envelope.version >= version;
						},
						then: action.authorize
					} );
				}
			} );
		} );
	}
}

module.exports = {
	getVersions: getVersions,
	getVersion: getVersion,
	processAuthorize: processAuthorize,
	processHandles: processHandles
};
