require( "../setup" );
var resources = require( "./resources" );
var links = require( "../../src/links" );

describe( "Action links", function() {
	describe( "with an inheritence hierarchy greater than 2", function() {
		describe( "when creating parentUrls", function() {
			var parent, child, grandChild, urlCache;

			before( function() {
				var model = {
					parentId: 1,
					childId: 2,
					id: 3
				};
				var fn = links.getParentUrlGenerator( {}, resources, { urlPrefix: "/test", apiPrefix: "/api" } );
				urlCache = links.getParentUrlCache( resources, { urlPrefix: "/test", apiPrefix: "/api" } );
				parent = fn( "parent", model );
				child = fn( "child", model );
				grandChild = fn( "grandChild", model );
			} );

			it( "should build the urlCache correctly", function() {
				urlCache.should.eql( {
					parent: { url: "", tokens: [] },
					child: { url: "/parent/{id}", tokens: [
							{ original: "id", namespace: "", resource: "parent", property: "id", camel: "parentId" }
						] },
					grandChild: { url: "/parent/{id}/child/{child.id}", tokens: [
							{ original: "id", namespace: "", resource: "parent", property: "id", camel: "parentId" },
							{ original: "child.id", namespace: "", resource: "child", property: "id", camel: "childId" }
						] }
				} );
			} );

			it( "should build the correct parentUrl for parent", function() {
				parent.should.equal( "" );
			} );

			it( "should build the correct parentUrl for child", function() {
				child.should.equal( "/parent/1" );
			} );

			it( "should build the correct parentUrl for grandChild", function() {
				grandChild.should.equal( "/parent/1/child/2" );
			} );
		} );

		describe( "when creating action urls", function() {
			var parent, child, grandChild, children, next;

			before( function() {
				var model = {
					parentId: 1,
					childId: 2,
					id: 3
				};
				var fn = links.getUrlGenerator( resources );
				parent = fn( "parent", "self", { id: 1 } );
				children = fn( "parent", "children", { id: 1 } );
				next = fn( "parent", "next-child-page", { id: 1 }, undefined, { data: { page: 1, size: 5 } } );
				child = fn( "child", "self", model );
				grandChild = fn( "grandChild", "self", model );
			} );

			it( "should build the correct parent url", function() {
				parent.should.equal( "/parent/1" );
			} );

			it( "should build the correct children url", function() {
				children.should.equal( "/parent/1/child" );
			} );

			it( "should generate the correct next-child-page url", function() {
				next.should.equal( "/parent/1/child?page=2&size=5" );
			} );

			it( "should build the correct child url", function() {
				child.should.equal( "/parent/1/child/2" );
			} );

			it( "should build the correct grandChild url", function() {
				grandChild.should.equal( "/parent/1/child/2/grand/3" );
			} );
		} );

		describe( "when creating action urls with request data", function() {
			var parent, child, grandChild, children, next;

			before( function() {
				var envelope = {
					data: {
						id: 1,
						childId: 2,
						grandChildId: 3,
						page: 1,
						size: 5
					}
				};
				var fn = links.getUrlGenerator( resources );
				parent = fn( "parent", "self", {}, undefined, envelope );
				children = fn( "parent", "children", {}, undefined, envelope );
				next = fn( "parent", "next-child-page", {}, undefined, envelope );
				child = fn( "child", "self", {}, undefined, envelope );
				grandChild = fn( "grandChild", "self", {}, undefined, envelope );
			} );

			it( "should build the correct parent url", function() {
				parent.should.equal( "/parent/1" );
			} );

			it( "should build the correct children url", function() {
				children.should.equal( "/parent/1/child" );
			} );

			it( "should generate the correct next-child-page url", function() {
				next.should.equal( "/parent/1/child?page=2&size=5" );
			} );

			it( "should build the correct child url", function() {
				child.should.equal( "/parent/1/child/2" );
			} );

			it( "should build the correct grandChild url", function() {
				grandChild.should.equal( "/parent/1/child/2/grand/3" );
			} );
		} );

		describe( "when creating action urls with a prefix", function() {
			var parent, child, grandChild, children, next;

			before( function() {
				var model = {
					parentId: 1,
					childId: 2,
					id: 3
				};
				var fn = links.getUrlGenerator( resources, { urlPrefix: "/test", apiPrefix: "/api" } );
				parent = fn( "parent", "self", { id: 1 } );
				children = fn( "parent", "children", { id: 1 } );
				next = fn( "parent", "next-child-page", { id: 1 }, undefined, { data: { page: 1, size: 5 } } );
				child = fn( "child", "self", model );
				grandChild = fn( "grandChild", "self", model );
			} );

			it( "should build the correct parent url", function() {
				parent.should.equal( "/test/api/parent/1" );
			} );

			it( "should build the correct children url", function() {
				children.should.equal( "/test/api/parent/1/child" );
			} );

			it( "should generate the correct next-child-page url", function() {
				next.should.equal( "/test/api/parent/1/child?page=2&size=5" );
			} );

			it( "should build the correct child url", function() {
				child.should.equal( "/test/api/parent/1/child/2" );
			} );

			it( "should build the correct grandChild url", function() {
				grandChild.should.equal( "/test/api/parent/1/child/2/grand/3" );
			} );
		} );
	} );

	describe( "with action rendering", function() {
		describe( "when rendering an \"plain\" action", function() {
			var expected = { self: { href: "/parent/1", method: "GET" } };
			var createLinks;
			var model;
			before( function() {
				model = {
					id: 1
				};
				createLinks = links.getLinkGenerator( resources );
			} );

			it( "should produce expected links", function() {
				return createLinks( "parent", "self", {}, model )
					.should.eventually.eql( expected );
			} );
		} );

		describe( "when rendering action with failed condition", function() {
			var expected = {};
			var createLinks;
			var model;

			before( function() {
				model = {
					id: 1
				};
				createLinks = links.getLinkGenerator( resources );
			} );

			it( "should produce expected links", function() {
				return createLinks( "parent", "children", {}, model )
					.should.eventually.eql( expected );
			} );
		} );

		describe( "when rendering action with failed auth", function() {
			var expected = {};
			var createLinks;
			var model;

			before( function() {
				model = {
					id: 1
				};
				createLinks = links.getLinkGenerator( resources );
			} );

			it( "should produce expected links", function() {
				return createLinks( "parent", "children", {}, model, "", function() {
					return false;
				} ).should.eventually.eql( expected );
			} );
		} );

		describe( "when rendering action with passed condition and no page size specified", function() {
			var parameters = {
				size: { range: [ 1, 100 ] }
			};
			var expected = {
				children: { href: "/parent/1/child", method: "GET", parameters: parameters },
				"next-child-page": { href: "/parent/1/child?page=2&size=5", method: "GET", parameters: parameters }
			};
			var createLinks;
			var model;

			before( function() {
				model = {
					id: 1,
					children: [ {} ]
				};
				createLinks = links.getLinkGenerator( resources );
			} );

			it( "should produce expected links", function() {
				return createLinks( "parent", "children", { data: { page: 1 } }, model )
					.should.eventually.eql( expected );
			} );
		} );

		describe( "when rendering action with passed condition and context", function() {
			var parameters = {
				page: { range: [ 1, 2 ] },
				size: { range: [ 1, 100 ] }
			};
			var expected = {
				children: { href: "/parent/1/child", method: "GET", parameters: parameters },
				"next-child-page": { href: "/parent/1/child?page=2&size=5", method: "GET", parameters: parameters }
			};
			var list;
			var createLinks;
			var model;

			before( function() {
				model = {
					id: 1,
					children: [ {}, {}, {}, {}, {}, {}, {}, {}, {}, {} ]
				};
				createLinks = links.getLinkGenerator( resources );
			} );

			it( "should produce expected links", function() {
				return createLinks( "parent", "children", { data: { page: 1, size: 5 } }, model, "" )
					.should.eventually.eql( expected );
			} );
		} );
	} );
} );
