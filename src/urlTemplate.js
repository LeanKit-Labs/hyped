var _ = require( "lodash" );

var expressFind = /[:]([^:\/?]*)/g;
var expressReplace = /[:]replace/g; // jshint ignore:line

var braceFind = /[{]([^}]*)[}]/g;
var braceReplace = /[{]replace[}]/g;

function camelCase( token ) {
	return camelize( token.resource, token.property );
}

function camelize( resource, property ) { // jshint ignore:line
	return _.isEmpty( resource ) ?
		property :
		resource + property[ 0 ].toUpperCase() + property.slice( 1 );
}

function createUrl( url, data, resource ) {
	if ( isExpressStyle( url ) ) {
		url = halStylePathVariables( url );
	}
	var tokens = getTokens( url );
	if ( tokens.length > 0 ) {
		url = processTokens( tokens, url, data, resource );
	}
	return url;
}

function expressStylePathVarialbes( url ) {
	var match;
	var expressUrl = url;
	while ( ( match = braceFind.exec( url ) ) ) {
		expressUrl = expressUrl.replace( match[ 0 ], ":" + match[ 1 ] );
	}
	return expressUrl;
}

function halStylePathVariables( url ) { // jshint ignore:line
	var match;
	var expressUrl = url;
	while ( ( match = expressFind.exec( url ) ) ) {
		expressUrl = expressUrl.replace( match[ 0 ], "{" + match[ 1 ] + "}" );
	}
	return expressUrl;
}

function getTokens( url ) { // jshint ignore:line
	var tokens = [];
	var match, tokenName;
	var pattern = isExpressStyle( url ) ? expressFind : braceFind;
	while ( ( match = pattern.exec( url ) ) ) {
		tokenName = match[ 1 ];
		tokens.push( parseToken( tokenName ) );
	}
	return tokens;
}

function isExpressStyle( url ) { // jshint ignore:line
	var found = expressFind.test( url );
	expressFind.lastIndex = 0;
	return found;
}

function parseRegex( regex ) {
	return regex.match( /\/g$/ ) ?
		new RegExp( regex.replace( /\/g$/, "" ).substring( 1 ), "g" ) :
		new RegExp( regex.substring( 1, regex.length - 1 ) );
}

function parseToken( token ) { // jshint ignore:line
	var parts = token.split( "." );
	return {
		original: token,
		namespace: parts.length > 2 ? parts.slice( 0, parts.length - 2 ) : "",
		resource: parts.length > 1 ? parts[ parts.length - 2 ] : "",
		property: parts[ parts.length - 1 ]
	};
}

function readDataByToken( resource, data, token ) {
	var value;
	var camel = camelCase( token );
	if ( data ) {
		value = data[ camel ] ||
		( data[ token.resource ] ? data[ token.resource ][ token.property ] : undefined ) ||
		( resource === token.resource ? data[ token.property ] : undefined );
	}
	var empty = value === undefined || value === {};
	var backup = !token.isChild && token.resource && token.resource === resource ? token.property : camel;
	var result = "{" + backup + "}";
	return empty ? result : value;
}

function processTokens( tokens, url, data, resource ) { // jshint ignore:line
	var token = tokens.pop();
	if ( token ) {
		var replacement = readDataByToken( resource, data, token );
		var stringified = ( braceReplace.toString() ).replace( /replace/, token.original );
		var replacer = parseRegex( stringified );
		var newUrl = url.replace( replacer, replacement );
		return processTokens( tokens, newUrl, data, resource );
	}
	return url;
}

module.exports = {
	toCamel: camelCase,
	create: createUrl,
	getTokens: getTokens,
	forExpress: expressStylePathVarialbes,
	forHal: halStylePathVariables,
	process: processTokens,
	readToken: readDataByToken
};
