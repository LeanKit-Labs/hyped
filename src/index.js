var _ = require( "lodash" );

var HyperResponse = require( "./hyperResponse.js" );
var HyperResource = require( "./hyperResource.js" );
var jsonEngine = require( "./jsonEngine.js" );
var halEngine = require( "./halEngine.js" );
var url = require( "./urlTemplate.js" );

var engines = {};
var hypermodels = {};
var resources = {};
var optionModels = {};
var fullOptionModels = {};
var prefix;
var maxVersion;
var preferLatest = false;
var excludeChildren;

var getVersion = function( req ) {
	if ( !maxVersion ) {
		maxVersion = getMaxVersion();
	}
	var accept = req.headers.accept;
	var match = /[.]v([0-9]*)/.exec( accept );
	var version = preferLatest ? maxVersion : 1;
	if ( match && match.length > 0 ) {
		version = parseInt( match[ 1 ] );
	}
	return version;
};

var wrapper = {
	addResource: addResource,
	addResources: addResources,
	getContentType: getContentType,
	getEngine: getEngine,
	getHyperModel: getHyperModel,
	getVersion: getVersion,
	hyperMiddleware: hyperMiddleware,
	optionsMiddleware: optionsMiddleware,
	registerEngine: addEngine,
	setupMiddleware: addMiddleware,
	urlStrategy: urlStrategy,
	versionWith: setVersioningStrategy,
};

function addEngine( engine, mediaType ) { // jshint ignore:line
	if ( _.isArray( mediaType ) ) {
		_.each( mediaType, function( m ) {
			engines[ m ] = engine;
		} );
	} else {
		engines[ mediaType ] = engine;
	}
}

function addMiddleware( host, apiPrefix ) { // jshint ignore:line
	if ( host.use ) {
		prefix = apiPrefix;
		host.use( apiPrefix, optionsMiddleware );
		host.use( apiPrefix, hyperMiddleware );
	} else {
		var urlPrefix = host.config.urlPrefix;
		apiPrefix = host.config.apiPrefix || "/api";
		prefix = [ urlPrefix, apiPrefix ].join( "" );
		host.http.middleware( prefix, optionsMiddleware );
		host.http.middleware( prefix, hyperMiddleware );
	}
}

function addResource( resource, resourceName ) { // jshint ignore:line
	resources[ resourceName ] = resource;
}

function addResources( resources ) { // jshint ignore:line
	if ( _.isArray( resources ) ) {
		_.each( resources, function( resource ) {
			addResource( resource, resource.name );
		} );
	} else {
		_.each( resources, addResource );
	}
}

function getContentType( req ) { // jshint ignore:line
	var mediaType = req.headers.accept;
	if ( !mediaType ) {
		mediaType = "application/json";
	}
	return mediaType;
}

function getEngine( mediaType ) { // jshint ignore:line
	var filtered = mediaType.replace( /[.]v[0-9]*/, "" );
	return engines[ filtered ];
}

function getHyperModel( req ) { // jshint ignore:line
	var version = 1;
	if ( req ) {
		version = getVersion( req );
	}
	if ( !hypermodels[ version ] ) {
		hypermodels[ version ] = HyperResource.renderFn( resources, prefix, version ); // jshint ignore: line
	}
	return hypermodels[ version ];
}

function getOptionModel( req ) {
	var version = 1;
	if ( req ) {
		version = getVersion( req );
	}
	if ( !optionModels[ version ] ) {
		optionModels[ version ] = HyperResource.optionsFn( resources, prefix, version, excludeChildren )( engines );
	}
	return optionModels[ version ];
}

function getFullOptionModel( req ) {
	var version = 1;
	if ( req ) {
		version = getVersion( req );
	}
	if ( !fullOptionModels[ version ] ) {
		fullOptionModels[ version ] = HyperResource.optionsFn( resources, prefix, version, false )( engines );
	}
	return fullOptionModels[ version ];
}

function getMaxVersion() { // jshint ignore:line
	return _.reduce( resources, function( version, resource ) {
		var max = _.max( _.keys( resource.versions ) );
		return max > version ? max : version;
	}, 1 );
}

function hyperMiddleware( req, res, next ) { // jshint ignore:line
	if ( !req.extendHttp ) {
		req.extendHttp = {};
	}
	var contentType = getContentType( req );
	var engine = getEngine( contentType );
	var hyperModel = getHyperModel( req );
	var response = new HyperResponse( req, res, engine, hyperModel, contentType ).origin( req.originalUrl, req.method ); // jshint ignore:line
	next();
}

function optionsMiddleware( req, res, next ) { // jshint ignore:line
	if ( req.method === "OPTIONS" || req.method === "options" ) {
		var contentType = getContentType( req );
		var engine = getEngine( contentType );
		if ( !engine ) {
			contentType = "application/json";
			engine = jsonEngine;
		}
		var optionModel = getOptionModel( req );
		var body = engine( optionModel, true );
		res.status( 200 ).set( "Content-Type", contentType ).send( body );
	} else {
		next();
	}
}

function setVersioningStrategy( fn ) { // jshint ignore:line
	getVersion = fn;
}

function urlStrategy( resourceName, actionName, action, resourceList ) { // jshint ignore:line
	if ( _.isEmpty( resources ) ) {
		resources = resourceList;
	}
	// will need to do this for all available versions at some point ...
	var options = getFullOptionModel();
	return url.forExpress( options._links[ [ resourceName, actionName ].join( ":" ) ].href );
}

module.exports = function( resourceList, defaultToNewest, includeChildrenInOptions ) {
	if ( resourceList === true || resourceList === false ) {
		preferLatest = resourceList;
		excludeChildren = defaultToNewest === undefined ? true : !defaultToNewest;
	} else {
		addResources( resourceList );
		preferLatest = defaultToNewest;
		excludeChildren = includeChildrenInOptions === undefined ? true : !includeChildrenInOptions;
	}
	addEngine( jsonEngine, "application/json" );
	addEngine( halEngine, "application/hal+json" );
	return wrapper;
};
