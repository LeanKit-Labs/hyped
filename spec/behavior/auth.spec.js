require( "../setup" );
var model = require( "../model.js" );
var HyperResource = require( "../../src/hyperResource.js" );

var board1 = model.board1;

describe( "Authorization", function() {
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
						shouldGetOmitted: "/board/:id?WAT"
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
			},
			_resource: "board",
			_action: "self"
		};

		var authCheck = function( actionName ) {
			return actionName !== "board:full";
		};

		before( function() {
			var fn = HyperResource.renderGenerator( { board: resource } );
			self = fn( "board", "self", {}, board1, "", undefined, undefined, authCheck );
		} );

		it( "should generate self hypermedia object model", function() {
			return self.should.eventually.eql( expectedSelf );
		} );
	} );
} );

