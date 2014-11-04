var HyperResponse = function( req, res, engine, hyperModel, contentType ) {
	this._authCheck = req._checkPermission || function() { return true; };
	this._code = 200;
	this._engine = engine;
	this._hyperModel = hyperModel;
	this._req = req;
	this._res = res;
	this._contentType = contentType;
		
	var self = this;
	req.extendHttp.hyped = req.hyped = function( model ) {
		self._model = model;
		return self;
	};
};

HyperResponse.prototype.action = function( action ) {
	this._action = action;
	return this;
};

HyperResponse.prototype.status = function( code ) {
	this._code = code;
	return this;
};

HyperResponse.prototype.resource = function( resource ) {
	this._resource = resource;
	return this;
};

HyperResponse.prototype.render = function() {
	if( this._engine ) {
		var resource = this._resource || this._req._resource;
		var action = this._action || this._req._action;
		var hypermedia = this._hyperModel( this._model, resource, action, this._authCheck );
		var body = this._engine( hypermedia );
		this._res.set( "Content-Type", this._contentType ).status( this._code ).send( body );
	} else {
		this._res.status( 415 ).send( "The requested media type '" + this._contentType + "' is not supported. Please see the OPTIONS at the api root to get a list of supported types." );
	}
};

module.exports = HyperResponse;