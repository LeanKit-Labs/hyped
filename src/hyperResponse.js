var _ = require( "lodash" );
var when = require( "when" );

function setModel( self, model, context ) {
	self._model = model;
	self._context = context;
	return self;
}

var HyperResponse = function( envelope, engine, hyperResource, contentType ) {
	this._code = 200;
	this._envelope = envelope;
	this._engine = engine;
	this._hyperResource = hyperResource;
	var req = this._req = envelope._original.req;
	this._res = envelope._original.res;
	this._contentType = contentType;
	this._context = req.context;
	this._headers = {};
	this._cookies = {};
	this._authCheck = req._checkPermission || function() {
		return true;
	};

	var self = this;
	req.extendHttp.hyped = req.hyped = setModel.bind( undefined, self );
	req.extendHttp.reply = this.render.bind( this );
	req.extendHttp.render = req.render = function( host, resource, action, result ) {
		var model = result.data ? result.data : result;
		var context = result.context ? result.context : self._context;
		setModel( self, model, context );
		self._code = result.status || result.statusCode || self._code;
		self._headers = result.headers || {};
		self._cookies = result.cookies || {};
		self._resource = result.resource || self._resource;
		self._action = result.action || self._action;
	};
};

HyperResponse.prototype.context = function( context ) {
	this._context = context;
	return this;
};

HyperResponse.prototype.cookies = function( cookies ) {
	this._cookies = cookies;
	return this;
};

HyperResponse.prototype.createResponse = function() {
	var resource = this._req._resource;
	var action = this._req._action;
	this._headers[ "Content-Type" ] = this._contentType;

	if ( this._code >= 400 ) {
		if ( this._engine.hal ) {
			_.assign( this._model, {
				_action: this._action || action,
				_resource: this._resource || resource,
				_origin: {
					href: this._originUrl,
					method: this._originMethod
				}
			} );
		}
		return when( {
			status: this._code,
			headers: this._headers,
			cookies: this._cookies,
			data: this._engine( this._model )
		} );
	}

	if ( this._code === 204 || !this._model ) {
		return when( {
			status: this._code,
			headers: this._headers,
			cookies: this._cookies
		} );
	}

	return this._hyperResource(
		this._resource || resource,
		this._action || action,
		this._envelope,
		this._model,
		"",
		this._originUrl,
		this._originMethod,
		this._engine.hal
	).then( function( hypermedia ) {
		return {
			status: this._code,
			headers: this._headers,
			cookies: this._cookies,
			data: this._engine( hypermedia )
		};
	}.bind( this ) );
};

HyperResponse.prototype.headers = function( headers ) {
	this._headers = headers;
	return this;
};

HyperResponse.prototype.origin = function( originUrl, method ) {
	this._originUrl = originUrl;
	this._originMethod = method;
	return this;
};

HyperResponse.prototype.status = function( code ) {
	this._code = code;
	return this;
};

HyperResponse.prototype.getResponse = function() {
	if ( this._engine ) {
		return this.createResponse();
	} else {
		return when( {
			status: 415,
			headers: {
				"Content-Type": "text/plain"
			},
			data: "The requested media type '" + this._contentType + "' is not supported. Please see the OPTIONS at the api root to get a list of supported types."
		} );
	}
};

HyperResponse.prototype.render = function() {
	var res = this._res;
	return this.getResponse()
		.then( function( response ) {
			if ( response.headers ) {
				_.each( response.headers, function( v, k ) {
					res.set( k, v );
				} );
			}
			if ( response.cookies ) {
				_.each( response.cookies, function( v, k ) {
					res.cookie( k, v.value, v.options );
				} );
			}
			res.status( response.status ).send( response.data );
			return response;
		} );
};

module.exports = HyperResponse;
