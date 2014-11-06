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
					"favstarred": "/board/:id?favstarred=true",
					"worstever": "/board/:id?h8=true",
					"next-page": function( data, context ) {
						return "/board/:id?page=" + ( context.page + 1 ) + "&size=" + context.size;
					},
					"prev-page": function( data, context ) {
						if( context.page && context.page > 1 ) {
							return "/board/:id?page=" + ( context.page - 1 ) + "&size=" + context.size;
						}
					}
				}
			}
		}
	};

	var self1, self2, full;
	var expectedSelf1 = {
		id: 100,
		title: "Test Board",
		_origin: { href: "/board/100", method: "GET" },
		_links: {
			self: { href: "/board/100", method: "GET" },
			favstarred: { href: "/board/100?favstarred=true", method: "GET" },
			worstever: { href: "/board/100?h8=true", method: "GET" },
			"next-page": { href: "/board/100?page=2&size=10", method: "GET" }
		}
	};

	var expectedSelf2 = {
		id: 100,
		title: "Test Board",
		_origin: { href: "/board/100", method: "GET" },
		_links: {
			self: { href: "/board/100", method: "GET" },
			favstarred: { href: "/board/100?favstarred=true", method: "GET" },
			worstever: { href: "/board/100?h8=true", method: "GET" },
			"next-page": { href: "/board/100?page=3&size=10", method: "GET" },
			"prev-page": { href: "/board/100?page=1&size=10", method: "GET" }
		}
	};

	before( function() {
		var start = Date.now();
		var hypermodel = HyperModel( { board: resource } );
		self1 = hypermodel( board1, "board", "self" ).useContext( { page: 1, size: 10 } ).render();
		self2 = hypermodel( board1, "board", "self" ).useContext( { page: 2, size: 10 } ).render();
		elapsedMs = Date.now() - start;
	} );

	it( 'should generate links correctly', function() {
		self1.should.eql( expectedSelf1 );
		self2.should.eql( expectedSelf2 );
	} );

	it( 'should not be slow as a big, dead ass', function() {
		elapsedMs.should.be.below( 1 );
	} );
} );