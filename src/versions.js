var _ = require( "lodash" );

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

module.exports = {
	getVersions: getVersions,
	getVersion: getVersion
};
