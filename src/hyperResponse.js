function setModel( self, model, context ) {
	self._model = model;
	self._context = context;
	return self;
}

var HyperResponse = function( req, res, engine, hyperResource, contentType ) {
	this._authCheck = req._checkPermission || function() {
		return true;
	};
	this._code = 200;
	this._engine = engine;
	this._hyperResource = hyperResource;
	this._req = req;
	this._res = res;
	this._contentType = contentType;
	this._context = {};
	this._headers = {};
	this._cookies = {};

	var self = this;
	req.extendHttp.hyped = req.hyped = setModel.bind( undefined, self );

	req.extendHttp.render = req.render = function( host, resource, action, result ) {
		var model = result.data ? result.data : result;
		var context = result.context ? result.context : {};
		setModel( self, model, context );
		self._code = result.status || result.statusCode || self._code;
		self._headers = result.headers || {};
		self._cookies = result.cookies || {};
		self._resource = result.resource || self._resource;
		self._action = result.action || self._action;
		return self.render();
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
		this._model,
		"",
		this._context,
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

HyperResponse.prototype.render = function() {
	if ( this._engine ) {
		return this.createResponse();
	} else {
		return {
			status: 415,
			headers: {
				"Content-Type": "text/html"
			},
			data: "The requested media type '" + this._contentType + "' is not supported. Please see the OPTIONS at the api root to get a list of supported types."
		};
	}
};

module.exports = HyperResponse;
