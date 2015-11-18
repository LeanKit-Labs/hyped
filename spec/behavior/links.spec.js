require( "../setup" );
var model = require( "../model.js" );
var HyperResource = require( "../../src/hyperResource.js" );

var board1 = model.board1;

describe( "Additional Links", function() {
	describe( "with static links", function() {
		var resource = {
			name: "board",
			actions: {
				self: {
					method: "get",
					url: "/board/:id",
					include: [ "id", "title" ],
					links: {
						favstarred: "/board/:id?favstarred=true",
						worstever: "/board/:id?h8=true",
						"next-page": function( envelope, data ) {
							if ( envelope.data.page && envelope.data.size ) {
								var page = envelope.data.page;
								var size = envelope.data.size;
								return "/board/:id?page=" + ( page + 1 ) + "&size=" + size;
							}
						},
						"prev-page": function( envelope, data ) {
							if ( envelope.data.page && envelope.data.size ) {
								var page = envelope.data.page;
								var size = envelope.data.size;
								if ( page > 1 ) {
									return "/board/:id?page=" + ( page - 1 ) + "&size=" + size;
								}
							}
						}
					}
				}
			}
		};

		var self1, self2;
		var expectedSelf1 = {
			id: 100,
			title: "Test Board",
			_origin: { href: "/board/100", method: "GET" },
			_resource: "board",
			_action: "self",
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
			_resource: "board",
			_action: "self",
			_links: {
				self: { href: "/board/100", method: "GET" },
				favstarred: { href: "/board/100?favstarred=true", method: "GET" },
				worstever: { href: "/board/100?h8=true", method: "GET" },
				"next-page": { href: "/board/100?page=3&size=10", method: "GET" },
				"prev-page": { href: "/board/100?page=1&size=10", method: "GET" }
			}
		};

		before( function() {
			var fn = HyperResource.renderGenerator( { board: resource } );
			self1 = fn( "board", "self", { data: { page: 1, size: 10 } }, board1 );
			self2 = fn( "board", "self", { data: { page: 2, size: 10 } }, board1 );
		} );

		it( "should include next-page in links for page 1", function() {
			return self1.should.eventually.eql( expectedSelf1 );
		} );

		it( "should include next-page and prev-page in links for page 2", function() {
			return self2.should.eventually.eql( expectedSelf2 );
		} );
	} );

	describe( "with resource prefixes", function() {
		var resource = {
			name: "board",
			urlPrefix: "/prefix1",
			apiPrefix: "/prefix2",
			actions: {
				self: {
					method: "get",
					url: "/board/:id",
					include: [ "id", "title" ],
					links: {
						favstarred: "/board/:id?favstarred=true",
						worstever: "/board/:id?h8=true",
						"next-page": function( envelope, data ) {
							if ( envelope.data.page && envelope.data.size ) {
								var page = envelope.data.page;
								var size = envelope.data.size;
								return "/board/:id?page=" + ( page + 1 ) + "&size=" + size;
							}
						},
						"prev-page": function( envelope, data ) {
							if ( envelope.data.page && envelope.data.size ) {
								var page = envelope.data.page;
								var size = envelope.data.size;
								if ( page > 1 ) {
									return "/board/:id?page=" + ( page - 1 ) + "&size=" + size;
								}
							}
						}
					}
				}
			}
		};

		var self1, self2;
		var expectedSelf1 = {
			id: 100,
			title: "Test Board",
			_origin: { href: "/badUrl/prefix1/badUrl/prefix2/board/100", method: "GET" },
			_resource: "board",
			_action: "self",
			_links: {
				self: { href: "/badUrl/prefix1/badUrl/prefix2/board/100", method: "GET" },
				favstarred: { href: "/badUrl/prefix1/badUrl/prefix2/board/100?favstarred=true", method: "GET" },
				worstever: { href: "/badUrl/prefix1/badUrl/prefix2/board/100?h8=true", method: "GET" },
				"next-page": { href: "/badUrl/prefix1/badUrl/prefix2/board/100?page=2&size=10", method: "GET" }
			}
		};

		var expectedSelf2 = {
			id: 100,
			title: "Test Board",
			_origin: { href: "/badUrl/prefix1/badUrl/prefix2/board/100", method: "GET" },
			_resource: "board",
			_action: "self",
			_links: {
				self: { href: "/badUrl/prefix1/badUrl/prefix2/board/100", method: "GET" },
				favstarred: { href: "/badUrl/prefix1/badUrl/prefix2/board/100?favstarred=true", method: "GET" },
				worstever: { href: "/badUrl/prefix1/badUrl/prefix2/board/100?h8=true", method: "GET" },
				"next-page": { href: "/badUrl/prefix1/badUrl/prefix2/board/100?page=3&size=10", method: "GET" },
				"prev-page": { href: "/badUrl/prefix1/badUrl/prefix2/board/100?page=1&size=10", method: "GET" }
			}
		};

		before( function() {
			var fn = HyperResource.renderGenerator( { board: resource }, { urlPrefix: "/badUrl", apiPrefix: "/badUrl" } );
			self1 = fn( "board", "self", { data: { page: 1, size: 10 } }, board1 );
			self2 = fn( "board", "self", { data: { page: 2, size: 10 } }, board1 );
		} );

		it( "should include next-page in links for page 1", function() {
			return self1.should.eventually.eql( expectedSelf1 );
		} );

		it( "should include next-page and prev-page in links for page 2", function() {
			return self2.should.eventually.eql( expectedSelf2 );
		} );
	} );
} );
