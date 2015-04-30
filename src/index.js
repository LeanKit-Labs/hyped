var _ = require( "lodash" );
var HyperResponse = require( "./hyperResponse.js" );
var HyperResource = require( "./hyperResource.js" );
var jsonEngine = require( "./jsonEngine.js" );
var halEngine = require( "./halEngine.js" );
var url = require( "./urlTemplate.js" );

function addEngine( state, engine, mediaType ) { // jshint ignore:line
	if ( _.isArray( mediaType ) ) {
		_.each( mediaType, function( m ) {
			state.engines[ m ] = engine;
		} );
	} else {
		state.engines[ mediaType ] = engine;
	}
}

function addMiddleware( state, host, apiPrefix ) { // jshint ignore:line
	if ( host.use ) {
		state.prefix = apiPrefix;
		host.use( state.apiPrefix, state.optionsMiddleware );
		host.use( state.apiPrefix, state.hyperMiddleware );
	} else {
		var urlPrefix = host.config.urlPrefix;
		apiPrefix = host.config.apiPrefix || "/api";
		state.prefix = [ urlPrefix, apiPrefix ].join( "" );
		host.http.middleware( state.prefix, state.optionsMiddleware, "options" );
		host.http.middleware( state.prefix, state.hyperMiddleware, "hyped" );
	}
}

function addResource( state, resource, resourceName ) { // jshint ignore:line
	state.resources[ resourceName ] = resource;
}

function addResources( state, resources ) { // jshint ignore:line
	if ( _.isArray( resources ) ) {
		_.each( resources, function( resource ) {
			addResource( state, resource, resource.name );
		} );
	} else {
		_.each( resources, addResource.bind( undefined, state ) );
	}
}

function createHost( state, autohost, config, done ) {
	config.noOptions = true;
	config.urlStrategy = state.urlStrategy;
	var host = autohost( config );
	state.setupMiddleware( host );
	var subscription;
	subscription = host.onResources( function( resources ) {
		state.addResources( resources );
		subscription.unsubscribe();
		if ( done ) {
			done();
		}
	} );
	return host;
}

function getContentType( req ) { // jshint ignore:line
	var mediaType = req.headers.accept;
	if ( !mediaType ) {
		mediaType = "application/json";
	}
	return mediaType;
}

function getEngine( state, mediaType ) { // jshint ignore:line
	var filtered = mediaType.replace( /[.]v[0-9]*/, "" );
	return state.engines[ filtered ];
}

function getHyperModel( state, req ) { // jshint ignore:line
	var version = 1;
	if ( req ) {
		version = getVersion( state, req );
	}
	if ( !state.hypermodels[ version ] ) {
		state.hypermodels[ version ] = HyperResource.renderFn( state.resources, state.prefix, version ); // jshint ignore: line
	}
	return state.hypermodels[ version ];
}

function getOptionModel( state, req ) {
	var version = 1;
	if ( req ) {
		version = getVersion( state, req );
	}
	if ( !state.optionModels[ version ] ) {
		state.optionModels[ version ] = HyperResource.optionsFn( state.resources, state.prefix, version, state.excludeChildren )( state.engines );
	}
	return state.optionModels[ version ];
}

function getFullOptionModel( state, req ) {
	var version = 1;
	if ( req ) {
		version = getVersion( req );
	}
	if ( !state.fullOptionModels[ version ] ) {
		state.fullOptionModels[ version ] = HyperResource.optionsFn( state.resources, state.prefix, version, false )( state.engines );
	}
	return state.fullOptionModels[ version ];
}

function getMaxVersion( state ) { // jshint ignore:line
	return _.reduce( state.resources, function( version, resource ) {
		var max = _.max( _.keys( resource.versions ) );
		return max > version ? max : version;
	}, 1 );
}

function getVersion( state, req ) {
	if ( state.versionStrategy ) {
		return state.versionStrategy( req );
	}
	if ( !state.maxVersion ) {
		state.maxVersion = getMaxVersion( state );
	}
	var accept = req.headers.accept;
	var match = /[.]v([0-9]*)/.exec( accept );
	var version = state.preferLatest ? state.maxVersion : 1;
	if ( match && match.length > 0 ) {
		version = parseInt( match[ 1 ] );
	}
	return version;
}

function hyperMiddleware( state, req, res, next ) { // jshint ignore:line
	if ( !req.extendHttp ) {
		req.extendHttp = {};
	}
	var contentType = getContentType( req );
	var engine = getEngine( state, contentType );
	var hyperModel = getHyperModel( state, req );
	var response = new HyperResponse( req, res, engine, hyperModel, contentType ).origin( req.originalUrl, req.method ); // jshint ignore:line
	next();
}

function optionsMiddleware( state, req, res, next ) { // jshint ignore:line
	if ( req.method === "OPTIONS" || req.method === "options" ) {
		var contentType = getContentType( req );
		var engine = state.getEngine( contentType );
		if ( !engine ) {
			contentType = "application/json";
			engine = jsonEngine;
		}
		var optionModel = getOptionModel( state, req );
		var body = engine( optionModel, true );
		res.status( 200 ).set( "Content-Type", contentType ).send( body );
	} else {
		next();
	}
}

function setVersioningStrategy( state, fn ) { // jshint ignore:line
	state.getVersion = fn;
}

function urlStrategy( state, resourceName, actionName, action, resourceList ) { // jshint ignore:line
	if ( _.isEmpty( state.resources ) ) {
		state.resources = resourceList;
	}
	// will need to do this for all available versions at some point ...
	var options = getFullOptionModel( state );
	return url.forExpress( options._links[ [ resourceName, actionName ].join( ":" ) ].href );
}

module.exports = function( resourceList, defaultToNewest, includeChildrenInOptions ) {
	var state = {
		engines: {},
		hypermodels: {},
		resources: {},
		optionModels: {},
		fullOptionModels: {},
		prefix: undefined,
		maxVersion: undefined,
		preferLatest: false,
		excludeChildren: undefined
	};

	_.merge( state, {
		addResource: addResource.bind( undefined, state ),
		addResources: addResources.bind( undefined, state ),
		createHost: createHost.bind( undefined, state ),
		getContentType: getContentType,
		getEngine: getEngine.bind( undefined, state ),
		getHyperModel: getHyperModel.bind( undefined, state ),
		getVersion: getVersion.bind( undefined, state ),
		hyperMiddleware: hyperMiddleware.bind( undefined, state ),
		optionsMiddleware: optionsMiddleware.bind( undefined, state ),
		registerEngine: addEngine.bind( undefined, state ),
		setupMiddleware: addMiddleware.bind( undefined, state ),
		urlStrategy: urlStrategy.bind( undefined, state ),
		versionWith: setVersioningStrategy.bind( undefined, state ),
	} );

	if ( resourceList === true || resourceList === false ) {
		state.preferLatest = resourceList;
		state.excludeChildren = defaultToNewest === undefined ? true : !defaultToNewest;
	} else {
		addResources( state, resourceList );
		state.preferLatest = defaultToNewest;
		state.excludeChildren = includeChildrenInOptions === undefined ? true : !includeChildrenInOptions;
	}
	addEngine( state, jsonEngine, "application/json" );
	addEngine( state, halEngine, "application/hal+json" );
	return state;
};
