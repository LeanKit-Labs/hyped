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
					"favstarred": "/board/:id?favstarred",
					"worstever": "/board/:id?h8ed",
					"next-page": function( data, context ) {
						return "/board/:id?page=" + ( context.page + 1 ) + "&size=" + context.size;
					},
					"prev-page": function( data, context ) {
						if( context.page && context.page > 1 ) {
							return "/board/:id?page=" + ( context.page - 1 ) + "&size=" + context.size;
						}
					}
				},
				parameters: {
					"favstarred": "flag",
					"h8ed": "flag",
					"page": function( data, context ) {
						return { range: [ 1, context.total / context.size ] };
					},
					"size": function( data, context ) {
						return { range: [ 1, context.total ] };
					}
				}
			}
		}
	};

	var self1, self2, full;

	var parameters = {
		favstarred: "flag",
		h8ed: "flag",
		page: { "range": [ 1, 10 ] },
		size: { "range": [ 1, 100 ] }
	};

	var expectedSelf1 = {
		id: 100,
		title: "Test Board",
		_origin: { href: "/board/100", method: "GET" },
		_links: {
			self: { href: "/board/100", method: "GET", parameters: parameters },
			favstarred: { href: "/board/100?favstarred", method: "GET", parameters: parameters },
			worstever: { href: "/board/100?h8ed", method: "GET", parameters: parameters },
			"next-page": { href: "/board/100?page=2&size=10", method: "GET", parameters: parameters }
		}
	};

	var expectedSelf2 = {
		id: 100,
		title: "Test Board",
		_origin: { href: "/board/100", method: "GET" },
		_links: {
			self: { href: "/board/100", method: "GET", parameters: parameters },
			favstarred: { href: "/board/100?favstarred", method: "GET", parameters: parameters },
			worstever: { href: "/board/100?h8ed", method: "GET", parameters: parameters },
			"next-page": { href: "/board/100?page=3&size=10", method: "GET", parameters: parameters },
			"prev-page": { href: "/board/100?page=1&size=10", method: "GET", parameters: parameters }
		}
	};

	before( function() {
		var start = Date.now();
		var hypermodel = HyperModel( { board: resource } );
		self1 = hypermodel( board1, "board", "self" ).useContext( { page: 1, size: 10, total: 100 } ).render();
		self2 = hypermodel( board1, "board", "self" ).useContext( { page: 2, size: 10, total: 100 } ).render();
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