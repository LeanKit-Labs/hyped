var _ = require( "lodash" );

function handleEmbedded( target, model, preserveMetadata ) {
	if( model._embedded ) {
		_.each( model._embedded, function( embedded, property ) {
			target[ property ] = _.isArray( embedded ) ? handleList( embedded, preserveMetadata ) : handleObject( embedded, preserveMetadata );
		} );
	}
}

function handleList( list, preserveMetadata ) { // jshint ignore:line
	return _.map( list, function( item ) {
		return process( item, preserveMetadata );
	} );
}

function handleObject( obj, preserveMetadata ) { // jshint ignore:line
	return process( obj, preserveMetadata );
}

function process( model, preserveMetadata ) {
	var body = preserveMetadata ? model : stripMetadata( model );
	handleEmbedded( body, model, preserveMetadata );
	return body;
}

function stripMetadata( model ) { // jshint ignore:line
	return _.omit( model, function( val, key ) { return key.indexOf( "_" ) === 0; } );
}

module.exports = process;