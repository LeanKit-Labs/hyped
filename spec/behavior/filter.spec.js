require( "../setup" );
var model = require( "../model.js" );
var hyperResource = require( "../../src/hyperResource.js" );

var board1 = model.board1;

describe( "Property Filtering", function() {
	describe( "with property filter", function() {
		var resource = {
			name: "board",
			actions: {
				self: {
					method: "get",
					url: "/board/:id",
					filter: function( value, key ) {
						return key.charAt( 0 ) !== "_" && key !== "lanes";
					}
				}
			}
		};

		var self;
		var expectedSelf = {
			id: 100,
			title: "Test Board",
			tags: [ "one", "two", "three" ],
			description: "This is a board and stuff!",
			_origin: { href: "/board/100", method: "GET" },
			_resource: "board",
			_action: "self",
			_links: {
				self: { href: "/board/100", method: "GET" }
			}
		};

		before( function() {
			var fn = hyperResource.renderGenerator( { board: resource } );
			self = fn( "board", "self", {}, board1, "", undefined, undefined, true );
		} );

		it( "should generate hypermedia without `lanes` or `hidden` fields", function() {
			return self.should.eventually.eql( expectedSelf );
		} );
	} );
} );
