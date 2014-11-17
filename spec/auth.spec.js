var should = require( "should" ); // jshint ignore: line
var model = require( "./model.js" );
var HyperResource = require( "../src/hyperResource.js" );

var board1 = model.board1;

describe( "when filtering links by permission", function() {
	var resource = {
		name: "board",
		actions: {
			self: {
				method: "get",
				url: "/board/:id",
				include: [ "id", "title" ]
			},
			full: {
				method: "get",
				url: "/board/:id?embed=lanes,cards,classOfService",
				include: [ "id", "title", "description" ],
				links: {
					"shouldGetOmitted": "/board/:id?WAT"
				}
			}
		}
	};

	var self;
	var expectedSelf = {
		id: 100,
		title: "Test Board",
		_origin: { href: "/board/100", method: "GET" },
		_links: {
			self: { href: "/board/100", method: "GET" }
		}
	};

	var authCheck = function( actionName ) {
		return actionName !== "board:full";
	};

	before( function() {
		var fn = HyperResource.renderFn( { board: resource } );
		self = fn( "board", "self", board1, "", undefined, undefined, undefined, authCheck );
	} );

	it( "should generate self hypermedia object model", function() {
		self.should.eql( expectedSelf );
	} );
} );
