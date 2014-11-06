var should = require( "should" ); // jshint ignore: line
var _ = require( "lodash" );
var when = require( "when" );
var model = require( "./model.js" );
var HyperModel = require( "../src/hyperModel.js" );

var board1 = model.board1;

describe( "with static links", function() {
	var elapsedMs;
	var resource = {
		name: "board",
		actions: {
			self: {
				method: "get",
				url: "/board/:id",
				include: [ "id", "title" ],
				links: {
					"favstarred": { url: "/board/:id?favstarred=true", method: "get" },
					"worstever": { url: "/board/:id?h8=true", method: "get" }
				}
			}
		}
	};

	var self, full;
	var expectedSelf = {
		id: 100,
		title: "Test Board",
		_origin: { href: "/for/teh/lulz", method: "WAT" },
		_links: {
			self: { href: "/board/100", method: "GET" },
			favstarred: { href: "/board/100?favstarred=true", method: "GET" },
			worstever: { href: "/board/100?h8=true", method: "GET" },
		}
	};

	before( function() {
		var start = Date.now();
		var hypermodel = HyperModel( { board: resource } );
		self = hypermodel( board1, "board", "self" ).useOrigin( "/for/teh/lulz", "WAT" ).render();
		elapsedMs = Date.now() - start;
	} );

	it( 'should generate self hypermedia object model', function() {
		self.should.eql( expectedSelf );
	} );

	it( 'should not be slow as a big, dead ass', function() {
		elapsedMs.should.be.below( 1 );
	} );
} );