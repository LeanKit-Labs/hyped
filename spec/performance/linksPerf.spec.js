require( "../setup" );
var model = require( "../model.js" );
var HyperResource = require( "../../src/hyperResource.js" );

var board1 = model.board1;
var limit = 5;

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
						if ( context.page && context.page > 1 ) {
							return "/board/:id?page=" + ( context.page - 1 ) + "&size=" + context.size;
						}
					}
				}
			}
		}
	};

	var self1, self2;

	before( function() {
		var start = Date.now();
		var fn = HyperResource.renderFn( { board: resource } );
		self1 = fn( "board", "self", board1, "", { page: 1, size: 10 } );
		self2 = fn( "board", "self", board1, "", { page: 2, size: 10 } );
		elapsedMs = Date.now() - start;
	} );

	it( "should be 'quick'", function() {
		elapsedMs.should.be.below( limit );
	} );
} );

describe( "with resource prefix", function() {
	var elapsedMs;
	var resource = {
		name: "board",
		urlPrefix: "/prefix",
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
						if ( context.page && context.page > 1 ) {
							return "/board/:id?page=" + ( context.page - 1 ) + "&size=" + context.size;
						}
					}
				}
			}
		}
	};

	var self1, self2;

	before( function() {
		var start = Date.now();
		var fn = HyperResource.renderFn( { board: resource } );
		self1 = fn( "board", "self", board1, "", { page: 1, size: 10 } );
		self2 = fn( "board", "self", board1, "", { page: 2, size: 10 } );
		elapsedMs = Date.now() - start;
	} );

	it( "should be 'quick'", function() {
		elapsedMs.should.be.below( limit );
	} );
} );
