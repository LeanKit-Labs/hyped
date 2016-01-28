require( "../setup" );
var halEngine = require( "../../src/halEngine.js" );

describe( "HAL Engine", function() {
	describe( "when rendering HAL", function() {
		var hal;

		var hypermodel = {
			id: 100,
			title: "Test Board",
			_origin: { href: "/board/100", method: "GET" },
			_resource: "board",
			_action: "self",
			_links: {
				self: { href: "/board/100", method: "GET" },
				full: { href: "/board/100?embed=lanes,cards,classOfService", method: "GET" },
				lanes: { href: "/board/100/lane", method: "GET" }
			}
		};

		var expected = _.cloneDeep( hypermodel );

		before( function() {
			hal = halEngine( hypermodel );
		} );

		it( "should render hal JSON", function() {
			hal.should.eql( expected );
		} );
	} );
} );
