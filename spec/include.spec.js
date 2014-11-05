var should = require( "should" ); // jshint ignore: line
var _ = require( "lodash" );
var when = require( "when" );
var model = require( "./model.js" );
var HyperModel = require( "../src/hyperModel.js" );

var board1 = model.board1;
var board2 = model.board2;
var deepCompare = model.deepCompare;

describe( "with inclusion list", function() {
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
					include: [ "id", "title", "description" ]
				}
			}
		};

		var self, full;
		var expectedSelf = {
			id: 100,
			title: "Test Board",
			_origin: { href: "/board/100", method: "GET" },
			_links: {
				self: { href: "/board/100", method: "GET" },
				full: { href: "/board/100?embed=lanes,cards,classOfService", method: "GET" }
			}
		};

		var expectedFull = {
			id: 100,
			title: "Test Board",
			description: "This is a board and stuff!",
			_origin: { href: "/board/100?embed=lanes,cards,classOfService", method: "GET" },
			_links: {
				self: { href: "/board/100", method: "GET" },
				full: { href: "/board/100?embed=lanes,cards,classOfService", method: "GET" }
			}
		};

		before( function() {
			var hypermodel = HyperModel( { board: resource } );
			self = hypermodel( board1, "board", "self" ).render();
			full = hypermodel( board1, "board", "full" ).render();
		} );

		it( 'should generate self hypermedia object model', function() {
			deepCompare( self, expectedSelf );
		} );

		it( 'should generate full hypermedia object model', function() {
			deepCompare( full, expectedFull );
		} );
	} );