var chai = require( "chai" );
chai.use( require( "chai-as-promised" ) );
global.should = chai.should();
global.expect = chai.expect;
global._ = require( "lodash" );
global.when = require( "when" );
global.lift = require( "when/node" ).lift;
global.seq = require( "when/sequence" );
global.fs = require( "fs" );
global.sinon = require( "sinon" );
global.proxyquire = require( "proxyquire" ).noPreserveCache();
var sinonChai = require( "sinon-chai" );
chai.use( sinonChai );

var _log = console.log;
console.log = function() {
	if ( typeof arguments[ 0 ] === "string" && /^[a-zA-Z]/.test( arguments[ 0 ] ) ) {
		return; // swallow this message
	} else {
		_log.apply( console, arguments );
	}
};
