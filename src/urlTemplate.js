var _ = require( "lodash" );
var find = /[:]([^:\/?]*)/g;
var replace = /[:]replace/g;

function camelCase ( token ) {
	return _.isEmpty( token.resource ) ? 
			token.property :
			token.resource + token.property[ 0 ].toUpperCase() + token.property.slice( 1 );
}

function createUrl( url, data, resource ) {
	var tokens = getTokens( url );
	if( tokens.length > 0 ) {
		url = processTokens( tokens, url, data, resource );
	}
	return url;
}

function getTokens( url ) { // jshint ignore:line
	var tokens = [];
	var match, tokenName;
	while( ( match = find.exec( url ) ) ) {
		tokenName = match[ 1 ];
		tokens.push( parseToken( tokenName ) );
	}
	return tokens;
}

function parseRegex( regex ) {
	return regex.match( /\/g$/ ) ?
		new RegExp( regex.replace(/\/g$/, "").substring( 1 ), "g" ) :
		new RegExp( regex.substring( 1, regex.length-1 ) );
}

function parseToken( token ) { // jshint ignore:line
	var parts = token.split( "." );
	return {
		original: token,
		namespace: parts.length > 2 ? parts.slice( 0, parts.length - 2 ) : "",
		resource: parts.length > 1 ? parts[ parts.length -2 ] : "",
		property: parts[ parts.length -1 ]
	};
}

function readDataByToken( resource, data, token ) {
	var result = ":" + camelCase( token );
	var value;
	if( data ) {
		if( token.resource === "" || token.resource === resource ) {
			value = data[ token.property ];
		} else if( data[ token.resource ] ) {
			value = data[ token.resource ][ token.property ];
		}
	}
	var empty = value === undefined || value === {};
	return empty ? result : value;
}

function processTokens( tokens, url, data, resource ) { // jshint ignore:line
	var token = tokens.pop();
	if( token ) {
		var replacement = readDataByToken( resource, data, token );
		var stringified = ( replace.toString() ).replace( /replace/, token.original );
		var replacer = parseRegex( stringified );
		var newUrl = url.replace( replacer, replacement );
		return processTokens( tokens, newUrl, data, resource );
	}
	return url;
}

module.exports = {
	toCamel: camelCase,
	create: createUrl,
	getTokens: getTokens
};