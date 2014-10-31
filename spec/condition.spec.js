var should = require( "should" ); // jshint ignore: line
var _ = require( "lodash" );
var when = require( "when" );
var model = require( "./model.js" );
var HyperModel = require( "../src/hyperModel.js" );

var board1 = model.board1;
var board2 = model.board2;
var deepCompare = model.deepCompare;

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
		_links: {
			self: { href: "/account/100100", method: "GET" },
			deposit: { href: "/account/100100/deposit", method: "POST" }
		}
	};

	var expected2 = {
		id: 100100,
		balance: 100,
		_origin: { href: "/account/100100", method: "GET" },
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
		_links: {
			self: { href: "/account/100100", method: "GET" },
			deposit: { href: "/account/100100/deposit", method: "POST" }
		}
	};

	var newAccount, withMoney, noMoney;

	before( function() {
		var hypermodel = HyperModel( { account: resource } );
		newAccount = hypermodel( acct, "account", "self" );
		acct.balance = 100;
		withMoney = hypermodel( acct, "account", "self" );
		acct.balance = 0;
		noMoney = hypermodel( acct, "account", "self" );
	} );

	it( 'should only show withdrawal if balance is greater than 0', function() {
		deepCompare( newAccount, expected1 );
		deepCompare( withMoney, expected2 );
		deepCompare( noMoney, expected3 );
	} );
} );