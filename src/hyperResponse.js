var HyperResponse = function( req, res, engine, hyperModel, contentType ) {
	this._authCheck = req._checkPermission || function() { return true; };
	this._code = 200;
	this._engine = engine;
	this._hyperModel = hyperModel;
	this._req = req;
	this._res = res;
	this._contentType = contentType;
	this._context = {};

	var self = this;
	req.extendHttp.hyped = req.hyped = function( model, context ) {
		self._model = model;
		self._context = context;
		return self;
	};
};

HyperResponse.prototype.action = function( action ) {
	this._action = action;
	this._originUrl = undefined;
	return this;
};

HyperResponse.prototype.context = function( context ) {
	this._context = context;
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

HyperResponse.prototype.resource = function( resource ) {
	this._resource = resource;
	this._originUrl = undefined;
	return this;
};

HyperResponse.prototype.render = function() {
	if( this._engine ) {
		var resource = this._req._resource;
		var action = this._req._action;
		var hypermedia = this._hyperModel( this._model, resource, action )
			.useResource( this._resource )
			.useAction( this._action )
			.useOrigin( this._originUrl, this._originMethod )
			.useContext( this._context )
			.auth( this._authCheck )
			.render();
		var body = this._engine( hypermedia );
		this._res.set( "Content-Type", this._contentType ).status( this._code ).send( body );
	} else {
		this._res.status( 415 ).send( "The requested media type '" + this._contentType + "' is not supported. Please see the OPTIONS at the api root to get a list of supported types." );
	}
};

module.exports = HyperResponse;