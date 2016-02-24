require( "../setup" );
var HyperResource = require( "../../src/hyperResource.js" );

describe( "Conditions", function() {
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
					condition: function( envelope, account ) {
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
			},
			_version: 1
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
			},
			_version: 1
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
			},
			_version: 1
		};
		var render;
		before( function() {
			render = HyperResource.renderGenerator( { account: resource } );
		} );

		it( "should not show withdraw on a new account", function() {
			return render( "account", "self", { version: 1 }, acct, "", undefined, undefined, true )
				.should.eventually.eql( expected1 );
		} );

		it( "should show withdraw since balance is greater than 0", function() {
			acct.balance = 100;
			return render( "account", "self", { version: 1 }, acct, "", undefined, undefined, true )
				.should.eventually.eql( expected2 );
		} );

		it( "should not show withdraw on an empty account", function() {
			acct.balance = 0;
			return render( "account", "self", { version: 1 }, acct, "", undefined, undefined, true )
				.should.eventually.eql( expected3 );
		} );
	} );
} );
