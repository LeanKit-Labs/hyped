require( "../setup" );
var model = require( "../model.js" );
var jsonEngine = require( "../../src/jsonEngine.js" );

describe( "JSON Engine", function() {
	describe( "when rendering json", function() {
		var json;

		var hypermodel = {
			id: 100,
			title: "Test Board",
			stringList: [ "one", "two", "three" ]
		};

		var expected = _.clone( hypermodel );

		before( function() {
			json = jsonEngine( hypermodel );
		} );

		it( "should render simple json", function() {
			json.should.eql( expected );
		} );
	} );
} );
