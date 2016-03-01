var _ = require( "lodash" );
var HyperResponse = require( "./hyperResponse.js" );
var HyperResource = require( "./hyperResource.js" );
var jsonEngine = require( "./jsonEngine.js" );
var halEngine = require( "./halEngine.js" );
var HttpEnvelope = require( "./httpEnvelope" );
var url = require( "./urlTemplate.js" );
var versions = require( "./versions" );

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
		state.prefix = { urlPrefix: "", apiPrefix: apiPrefix };
		host.use( apiPrefix, state.optionsMiddleware );
		host.use( apiPrefix, state.hyperMiddleware );
	} else {
		var urlPrefix = host.config.urlPrefix;
		if ( _.has( host.config, "apiPrefix" ) ) {
			apiPrefix = host.config.apiPrefix === undefined ? "/" : host.config.apiPrefix;
		} else {
			apiPrefix = "/api";
		}
		state.prefix = {
			urlPrefix: urlPrefix,
			apiPrefix: apiPrefix
		};

		var prefixUrl = [
			urlPrefix,
			apiPrefix
		].join( "" ).replace( "//", "/" );

		host.http.middleware( prefixUrl, state.optionsMiddleware, "options" );
		host.http.middleware( prefixUrl, state.hyperMiddleware, "hyped" );
	}
}

function addResourceMiddleware( state, host ) {
	var resourcePrefixes = _.filter( _.uniq( _.map( _.values( state.resources ), "urlPrefix" ) ) );
	_.each( resourcePrefixes, function( resourcePrefix ) {
		var resourcePrefixUrl = [
			state.prefix.urlPrefix,
			resourcePrefix,
			state.prefix.apiPrefix
		].join( "" ).replace( "//", "/" );
		host.http.middleware( resourcePrefixUrl, state.hyperMiddleware, "hyped" );
	} );
}

function addResource( state, resource, resourceName ) { // jshint ignore:line
	versions.processHandles( resource );
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
		addResourceMiddleware( state, host );
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
	var filtered = mediaType.replace( /[.]v[0-9]*/, "" ).split( ";" )[ 0 ];
	return state.engines[ filtered ];
}

function getEnvelope( req, res ) {
	return new HttpEnvelope( req, res );
}

function getHyperModel( state, envelope ) { // jshint ignore:line
	var version = 1;
	if ( envelope ) {
		version = getVersion( state, envelope );
	}
	if ( !state.hypermodels[ version ] ) {
		state.hypermodels[ version ] = HyperResource.renderGenerator( state.resources, state.prefix, version ); // jshint ignore: line
	}
	return state.hypermodels[ version ];
}

function getOptionModel( state, envelope ) {
	var version = 1;
	if ( envelope ) {
		version = getVersion( state, envelope );
	}
	return HyperResource.optionsGenerator( state.resources, state.prefix, version, state.excludeChildren, envelope )( state.engines );
}

function getFullOptionModel( state ) {
	var version = 1;
	if ( !state.fullOptionModels[ version ] ) {
		state.fullOptionModels[ version ] = HyperResource.routesGenerator( state.resources, state.prefix, version )( state.engines );
	}
	return state.fullOptionModels[ version ];
}

function getMaxVersion( state ) { // jshint ignore:line
	return _.reduce( state.resources, function( version, resource ) {
		var max = _.maxBy( _.keys( resource.versions ), parseInt );
		return max > version ? max : version;
	}, 1 );
}

function getMimeVersion( header ) {
	var version;
	var match = /[.]v([0-9]*)/.exec( header );
	if ( match && match.length > 0 ) {
		version = match[ 1 ];
	}
	return version;
}

function getParameterVersion( header ) {
	var version;
	var match = /version\s*[=]\s*([0-9]+)[;]?/g.exec( header );
	if ( match && match.length > 0 ) {
		version = match[ 1 ];
	}
	return version;
}

function getVersion( state, envelope ) {
	if ( state.versionStrategy ) {
		return state.versionStrategy( envelope._original.req );
	}
	if ( !state.maxVersion ) {
		state.maxVersion = getMaxVersion( state );
	}
	var accept = envelope.headers.accept || "";
	var mimeVersion = getMimeVersion( accept );
	var parameterVersion = getParameterVersion( accept );
	var version = state.preferLatest ? state.maxVersion : 1;
	var final = parseInt( mimeVersion || parameterVersion || version );
	envelope.version = final;
	return final;
}

function hyperMiddleware( state, req, res, next ) { // jshint ignore:line
	if ( !req.extendHttp ) {
		req.extendHttp = {};
	}
	var contentType = getContentType( req );
	if ( contentType === "*/*" || contentType === undefined ) {
		contentType = state.defaultContentType;
	}
	var engine = getEngine( state, contentType );
	var hyperModel = getHyperModel( state, req );
	var envelope = getEnvelope( req, res );
	var response = new HyperResponse( envelope, engine, hyperModel, contentType ).origin( req.originalUrl, req.method ); // jshint ignore:line
	if ( !req.context ) {
		req.context = {};
	}
	req.context.version = getVersion( state, envelope );
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
		var envelope = getEnvelope( req, res );
		getOptionModel( state, envelope )
			.then( function( optionModel ) {
				var body = engine( optionModel, true );
				res.status( 200 ).set( "Content-Type", contentType ).send( body );
			} );
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
	var link = options._links[ [ resourceName, actionName ].join( ":" ) ];
	return link ? url.forExpress( link.href ) : "";
}

module.exports = function( resourceList, defaultToNewest, includeChildrenInOptions ) {
	var state = {
		engines: {},
		hypermodels: {},
		resources: {},
		fullOptionModels: {},
		prefix: undefined,
		maxVersion: undefined,
		preferLatest: false,
		excludeChildren: undefined,
		defaultContentType: "application/json"
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
		versionWith: setVersioningStrategy.bind( undefined, state )
	} );

	var config;
	if ( _.isBoolean( resourceList ) ) {
		state.preferLatest = resourceList;
		state.excludeChildren = defaultToNewest === undefined ? true : !defaultToNewest;
	} else if ( !_.isArray( resourceList ) ) {
		config = resourceList;
	} else {
		addResources( state, resourceList );
		if ( _.isBoolean( defaultToNewest ) ) {
			state.preferLatest = defaultToNewest;
			state.excludeChildren = includeChildrenInOptions === undefined ? true : !includeChildrenInOptions;
		} else {
			config = defaultToNewest;
		}
	}

	if ( config ) {
		state.preferLatest = config.defaultToNewest === undefined ? false : config.defaultToNewest;
		state.excludeChildren = config.includeChildrenInOptions === undefined ? true : !config.includeChildrenInOptions;
		state.defaultContentType = config.defaultContentType || "application/json";
	}

	addEngine( state, jsonEngine, "application/json" );
	addEngine( state, halEngine, "application/hal+json" );
	return state;
};
