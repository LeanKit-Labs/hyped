var should = require( "should" ); // jshint ignore: line
var _ = require( "lodash" );
var when = require( "when" );
var model = require( "./model.js" );
var HyperModel = require( "../src/hyperModel.js" );

var board1 = model.board1;
var board2 = model.board2;
var deepCompare = model.deepCompare;

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

	var self, full;
	var expectedSelf = {
		id: 100,
		title: "Test Board",
		_origin: { href: "/board/100", method: "GET" },
		_links: {
			self: { href: "/board/100", method: "GET" }
		}
	};

	var authCheck = function( actionName, model ) {
		return actionName !== "board.full";
	};

	before( function() {
		var hypermodel = HyperModel( { board: resource } );
		self = hypermodel( board1, "board", "self" ).auth( authCheck ).render();
	} );

	it( 'should generate self hypermedia object model', function() {
		self.should.eql( expectedSelf );
	} );
} );
