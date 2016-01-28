require( "../setup" );
var model = require( "../model.js" );
var HyperResource = require( "../../src/hyperResource.js" );

var board1 = model.board1;

describe.only( "Authorization", function() {
	describe( "when filtering links by permission", function() {
		var resource = {
			name: "board",
			actions: {
				self: {
					method: "get",
					url: "/board/:id",
					authorize: sinon.stub().returns( true ),
					include: [ "id", "title" ]
				},
				full: {
					method: "get",
					url: "/board/:id?embed=lanes,cards,classOfService",
					include: [ "id", "title", "description" ],
					authorize: function() {
						return false;
					},
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

		before( function() {
			var fn = HyperResource.renderGenerator( { board: resource } );
			return fn( "board", "self", {}, board1, "", undefined, undefined, true ).then( function( data ) {
				self = data;
			} );
		} );

		it( "should generate self hypermedia object model", function() {
			self.should.eql( expectedSelf );
		} );

		it( "should not call authorize a second time when rendering the self response", function() {
			resource.actions.self.authorize.should.be.calledOnce;
		} );
	} );
} );

