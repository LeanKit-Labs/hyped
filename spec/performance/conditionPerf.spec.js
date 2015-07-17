require( "../setup" );
var HyperResource = require( "../../src/hyperResource.js" );

var limit = 4;

require( "../setup" );
var HyperResource = require( "../../src/hyperResource.js" );

describe( "when filtering links by predicate with performance expectation", function() {
	var resource = {
		name: "account",
		actions: {
			self: {
				method: "get",
				url: "/account/:id",
				include: [ "id", "balance" ]
			}
		}
	};

	var acct = {
		id: 100100,
		balance: 0
	};

	var newAccount, withMoney, noMoney, elapsed1, elapsed2, elapsed3, elapsed4;

	before( function() {
		var start = Date.now();
		var fn = HyperResource.renderFn( { account: resource } );
		elapsed1 = ( Date.now() - start );
		start = Date.now();
		newAccount = fn( "account", "self", acct );
		elapsed2 = ( Date.now() - start );
		acct.balance = 100;
		start = Date.now();
		withMoney = fn( "account", "self", acct );
		elapsed3 = ( Date.now() - start );
		acct.balance = 0;
		start = Date.now();
		noMoney = fn( "account", "self", acct );
		elapsed4 = ( Date.now() - start );
	} );

	it( "should be 'quick'", function() {
		elapsed1.should.be.below( limit );
		elapsed2.should.be.below( limit );
		elapsed3.should.be.below( limit );
		elapsed4.should.be.below( limit );
	} );
} );
