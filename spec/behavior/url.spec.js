require( "../setup" );
var url = require( "../../src/urlTemplate.js" );

describe( "URL Template", function() {
	describe( "when replacing a token property with a model property", function() {
		var template = "/this/is/{a.test}/of.stuff";
		var model = { test: "atest" };
		var expected = "/this/is/atest/of.stuff";
		var href;

		before( function() {
			href = url.create( template, model, "a" );
		} );

		it( "should replace the token with the matching model property", function() {
			href.should.equal( expected );
		} );
	} );

	describe( "when replacing multiple tokens with matches", function() {
		var template = "/parent/:parent.id/child/:child.id/grand/:id";
		var model = { parentId: 1, childId: 2, id: 3 };
		var expected = "/parent/1/child/2/grand/3";
		var href;

		before( function() {
			href = url.create( template, model, "grandChild" );
		} );

		it( "should replace all tokens correctly", function() {
			href.should.equal( expected );
		} );
	} );

	describe( "when replacing a token with a model property", function() {
		var template = "/this/is/{test}/of.stuff";
		var model = { test: "atest" };
		var expected = "/this/is/atest/of.stuff";
		var href;

		before( function() {
			href = url.create( template, model, "a" );
		} );

		it( "should replace the token with the matching model property", function() {
			href.should.equal( expected );
		} );
	} );

	describe( "when a token has no corresponding model property", function() {
		var template = "/this/is/{derp}/of.stuff";
		var model = { test: "atest" };
		var expected = "/this/is/{derp}/of.stuff";
		var href;

		before( function() {
			href = url.create( template, model, "a" );
		} );

		it( "should keep token in place", function() {
			href.should.equal( expected );
		} );
	} );

	describe( "when a token property has no corresponding model property", function() {
		var template = "/this/is/{herp.derp}/of.stuff";
		var model = { test: "atest" };
		var expected = "/this/is/{herpDerp}/of.stuff";
		var href;

		before( function() {
			href = url.create( template, model, "a" );
		} );

		it( "should create a camel cased token name", function() {
			href.should.equal( expected );
		} );
	} );

	describe( "when replacing path variables for use in express", function() {
		var template = "/this/is/{herp.derp}/of.stuff/{id}";
		var expected = "/this/is/:herp.derp/of.stuff/:id";
		var href;

		before( function() {
			href = url.forExpress( template );
		} );

		it( "should replace token with express-friendly version", function() {
			href.should.equal( expected );
		} );
	} );

	describe( "when replacing path variables for use in hal", function() {
		var template = "/resource/:id/child/:herp.derp";
		var expected = "/resource/{id}/child/{herp.derp}";
		var href;

		before( function() {
			href = url.forHal( template );
		} );

		it( "should replace token with hal-friendly version", function() {
			href.should.equal( expected );
		} );
	} );
} );
