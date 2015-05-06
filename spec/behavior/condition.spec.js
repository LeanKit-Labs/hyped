require( "../setup" );
var HyperResource = require( "../../src/hyperResource.js" );

describe( "when filtering links by predicate", function() {
	var resource = {
		name: "account",
		actions: {
			self: {
				method: "get",
				url: "/account/:id",
				include: [ "id", "balance" ]
			},
			withdraw: {
				method: "POST",
				url: "/account/:id/withdrawal",
				condition: function( account ) {
					return account.balance > 0;
				},
				include: [ "id", "accountId", "amount", "balance", "newBalance" ]
			},
			deposit: {
				method: "POST",
				url: "/account/:id/deposit",
				include: [ "id", "accountId", "amount", "balance", "newBalance" ]
			}
		}
	};

	var acct = {
		id: 100100,
		balance: 0
	};

	var expected1 = {
		id: 100100,
		balance: 0,
		_origin: { href: "/account/100100", method: "GET" },
		_resource: "account",
		_action: "self",
		_links: {
			self: { href: "/account/100100", method: "GET" },
			deposit: { href: "/account/100100/deposit", method: "POST" }
		}
	};

	var expected2 = {
		id: 100100,
		balance: 100,
		_origin: { href: "/account/100100", method: "GET" },
		_resource: "account",
		_action: "self",
		_links: {
			self: { href: "/account/100100", method: "GET" },
			withdraw: { href: "/account/100100/withdrawal", method: "POST" },
			deposit: { href: "/account/100100/deposit", method: "POST" }
		}
	};

	var expected3 = {
		id: 100100,
		balance: 0,
		_origin: { href: "/account/100100", method: "GET" },
		_resource: "account",
		_action: "self",
		_links: {
			self: { href: "/account/100100", method: "GET" },
			deposit: { href: "/account/100100/deposit", method: "POST" }
		}
	};

	var newAccount, withMoney, noMoney, elapsed1, elapsed2, elapsed3, elapsed4;

	before( function() {
		var fn = HyperResource.renderFn( { account: resource } );
		newAccount = fn( "account", "self", acct );
		acct.balance = 100;
		withMoney = fn( "account", "self", acct );
		acct.balance = 0;
		noMoney = fn( "account", "self", acct );
	} );

	it( "should only show withdrawal if balance is greater than 0", function() {
		newAccount.should.eql( expected1 );
		withMoney.should.eql( expected2 );
		noMoney.should.eql( expected3 );
	} );

} );
