var _ = require( "lodash" );

function HttpEnvelope( req, res ) {
	this.transport = "http";
	this.context = req.context;
	this.cookies = req.cookies;
	this.data = req.body ? _.cloneDeep( req.body ) : {};
	this.body = req.body || {};
	this.query = req.query || {};
	this.params = req.params || {};
	this.files = req.files;
	this.headers = req.headers;
	this.path = this.url = req.url;
	this.responseStream = res;
	this.session = req.session;
	this.user = req.user;
	this.method = req.method.toLowerCase();
	this._original = {
		req: req,
		res: res
	};

	Object.defineProperties( this, {
		action: {
			get: function() {
				return req._action;
			}
		},
		resource: {
			get: function() {
				return req._resource;
			}
		}
	} );

	this.version = ( this.context && this.context.version ) ? this.context.version : 1;

	_.extend( this.data, req.params );
	Object.keys( req.query ).forEach( function( key ) {
		var val = req.query[ key ];
		if ( !this.data.hasOwnProperty( key ) ) {
			this.data[ key ] = val;
		}
		if ( !this.params.hasOwnProperty( key ) ) {
			this.params[ key ] = val;
		}
	}.bind( this ) );

	// an awful but necessary hack used so that autohost
	// can back populate the data object with parameter details
	req.data = this.data;

	if ( req.extendHttp ) {
		_.each( req.extendHttp, function( val, key ) {
			this[ key ] = val;
		}.bind( this ) );
	}
}

module.exports = HttpEnvelope;
