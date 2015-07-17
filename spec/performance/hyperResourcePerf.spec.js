require( "../setup" );
var url = require( "../../src/urlTemplate.js" );
var HyperResource = require( "../../src/hyperResource.js" );

var limit = 4;

var resources = require( "../behavior/resources.js" );

describe( "Action links performance", function() {

	describe( "when rendering action with embedded resources with performance expectation", function() {
		var expected = {
			id: 2,
			parentId: 1,
			title: "child",
			_origin: { href: "/test/api/parent/1/child/2", method: "GET" },
			_resource: "child",
			_action: "self",
			_links: {
				self: { href: "/test/api/parent/1/child/2", method: "GET" }
			},
			_embedded: {
				grandChildren: [
					{ id: 1,
						_origin: { href: "/test/api/parent/1/child/2/grand/1", method: "GET" },
						_resource: "grandChild",
						_action: "self",
						_links: {
							self: { href: "/test/api/parent/1/child/2/grand/1", method: "GET" },
							create: { href: "/test/api/parent/1/child/2/grand", method: "POST" }
						}
					},
					{ id: 2,
						_origin: { href: "/test/api/parent/1/child/2/grand/2", method: "GET" },
						_resource: "grandChild",
						_action: "self",
						_links: {
							self: { href: "/test/api/parent/1/child/2/grand/2", method: "GET" },
							create: { href: "/test/api/parent/1/child/2/grand", method: "POST" }
						}
					},
					{ id: 3,
						_origin: { href: "/test/api/parent/1/child/2/grand/3", method: "GET" },
						_resource: "grandChild",
						_action: "self",
						_links: {
							self: { href: "/test/api/parent/1/child/2/grand/3", method: "GET" },
							create: { href: "/test/api/parent/1/child/2/grand", method: "POST" }
						}
					},
					{ id: 4,
						_origin: { href: "/test/api/parent/1/child/2/grand/4", method: "GET" },
						_resource: "grandChild",
						_action: "self",
						_links: {
							self: { href: "/test/api/parent/1/child/2/grand/4", method: "GET" },
							create: { href: "/test/api/parent/1/child/2/grand", method: "POST" }
						}
					},
					{ id: 5,
						_origin: { href: "/test/api/parent/1/child/2/grand/5", method: "GET" },
						_resource: "grandChild",
						_action: "self",
						_links: {
							self: { href: "/test/api/parent/1/child/2/grand/5", method: "GET" },
							create: { href: "/test/api/parent/1/child/2/grand", method: "POST" }
						}
					}
				]
			}
		};
		var response;
		var data = {
			id: 2,
			parentId: 1,
			title: "child",
			grandChildren: [ { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 } ]
		};
		var elapsed;

		before( function() {
			var fn1 = HyperResource.resourceFn( resources, "/test/api" );
			var start = Date.now();
			response = fn1( "child", "self", data );
			elapsed = Date.now() - start;
		} );

		it( "should be 'quick'", function() {
			elapsed.should.be.below( limit );
		} );
	} );

	describe( "when rendering a list of top-level resources with performance expectation", function() {
		var parameters = {
			size: { range: [ 1, 100 ] }
		};
		var expected = {
			_origin: { href: "/parent", method: "GET" },
			parents: [
				{
					id: 1,
					title: "one",
					children: [ {} ],
					description: "the first item",
					_origin: { href: "/parent/1", method: "GET" },
					_resource: "parent",
					_action: "self",
					_links: {
						self: { href: "/parent/1", method: "GET" },
						list: { href: "/parent", method: "GET" },
						children: { href: "/parent/1/child", method: "GET", parameters: parameters }
					}
				},
				{
					id: 2,
					title: "two",
					children: [ {} ],
					description: "the second item",
					_origin: { href: "/parent/2", method: "GET" },
					_resource: "parent",
					_action: "self",
					_links: {
						self: { href: "/parent/2", method: "GET" },
						list: { href: "/parent", method: "GET" },
						children: { href: "/parent/2/child", method: "GET", parameters: parameters }
					}
				}
			]
		};
		var response;
		var data = [
			{
				id: 1,
				title: "one",
				description: "the first item",
				children: [ {} ]
			},
			{
				id: 2,
				title: "two",
				description: "the second item",
				children: [ {} ]
			}
		];
		var elapsed;

		before( function() {
			var fn1 = HyperResource.resourcesFn( resources );

			var start = Date.now();
			response = fn1( "parent", "self", data, "", undefined, "/parent", "GET" );
			elapsed = Date.now() - start;
		} );

		it( "should be 'quick'", function() {
			elapsed.should.be.below( limit );
		} );
	} );

	describe( "when rendering a list of resources from another resource with performance expectation", function() {
		var expected = {
			_origin: { href: "/parent/1/child", method: "GET" },
			children: [
				{
					id: 1,
					parentId: 1,
					title: "one",
					description: "the first item",
					_resource: "child",
					_action: "self",
					_origin: { href: "/parent/1/child/1", method: "GET" },
					_links: {
						self: { href: "/parent/1/child/1", method: "GET" },
					}
				},
				{
					id: 2,
					parentId: 1,
					title: "two",
					description: "the second item",
					_resource: "child",
					_action: "self",
					_origin: { href: "/parent/1/child/2", method: "GET" },
					_links: {
						self: { href: "/parent/1/child/2", method: "GET" },
					}
				}
			]
		};

		var response;
		var data = [
			{
				id: 1,
				parentId: 1,
				title: "one",
				description: "the first item"
			},
			{
				id: 2,
				parentId: 1,
				title: "two",
				description: "the second item"
			}
		];

		var elapsed;

		before( function() {
			var fn1 = HyperResource.resourcesFn( resources );
			var start = Date.now();
			response = fn1( "child", "self", data, "", undefined, "/parent/1/child", "GET" );
			elapsed = Date.now() - start;
		} );

		it( "should be 'quick'", function() {
			elapsed.should.be.below( limit );
		} );
	} );

	describe( "Timing token replacement with performance expectation", function() {
		var testUrl = "/parent/:id/child/:child.id";

		describe( "When replacing 2 tokens 1000 times with regex", function() {
			var elapsed;
			var urls = [];
			before( function() {
				var start = Date.now();
				var tokens = url.getTokens( testUrl );
				var halUrl = url.forHal( testUrl );
				for (var i = 0; i < 1000; i++) {

					urls.push( url.process( _.clone( tokens ), halUrl, { id: 1, childId: 2 }, "parent" ) );
				}
				elapsed = Date.now() - start;
			} );

			// it( "should produce a valid URL", function() {
			// 	urls[ 1 ].should.equal( "/parent/1/child/2" );
			// } );

			it( "should be 'quick'", function() {
				elapsed.should.be.below( 40 );
			} );
		} );
	} );
} );
