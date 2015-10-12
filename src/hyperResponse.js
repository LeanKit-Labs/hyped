var _ = require( "lodash" );

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

	req.extendHttp.render = req.render = function( host, resource, action, result ) {
		var model = result.data ? result.data : result;
		var context = result.context ? result.context : self._context;
		setModel( self, model, context );
		self._code = result.status || result.statusCode || self._code;
		self._headers = result.headers || {};
		self._cookies = result.cookies || {};
		self._resource = result.resource || self._resource;
		self._action = result.action || self._action;
		return self.getResponse();
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
	var hypermedia = this._hyperResource(
		this._resource || resource,
		this._action || action,
		this._envelope,
		this._model,
		"",
		this._originUrl,
		this._originMethod
	);
	this._headers[ "Content-Type" ] = this._contentType;
	return {
		status: this._code,
		headers: this._headers,
		cookies: this._cookies,
		data: this._engine( hypermedia )
	};
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
		return {
			status: 415,
			headers: {
				"Content-Type": "text/plain"
			},
			data: "The requested media type '" + this._contentType + "' is not supported. Please see the OPTIONS at the api root to get a list of supported types."
		};
	}
};

HyperResponse.prototype.render = function() {
	var res = this._res;
	var response = this.getResponse();
	if ( response.headers ) {
		_.each( response.headers, function( v, k ) {
			res.set( k, v );
		}.bind( this ) );
	}
	if ( response.cookies ) {
		_.each( response.cookies, function( v, k ) {
			res.cookie( k, v.value, v.options );
		}.bind( this ) );
	}
	res.status( response.status ).send( response.data );
};

module.exports = HyperResponse;
