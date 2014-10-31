var should = require( "should" );
var url = require( "../src/urlTemplate.js" );

describe( "when replacing a token property with a model property", function() {
	var template = "/this/is/:a.test/of.stuff";
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

describe( "when replacing a token with a model property", function() {
	var template = "/this/is/:test/of.stuff";
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
	var template = "/this/is/:derp/of.stuff";
	var model = { test: "atest" };
	var expected = "/this/is/:derp/of.stuff";
	var href;

	before( function() {
		href = url.create( template, model, "a" );
	} );

	it( "should keep token in place", function() {
		href.should.equal( expected );
	} );
} );

describe( "when a token property has no corresponding model property", function() {
	var template = "/this/is/:herp.derp/of.stuff";
	var model = { test: "atest" };
	var expected = "/this/is/:herpDerp/of.stuff";
	var href;

	before( function() {
		href = url.create( template, model, "a" );
	} );

	it( "should create a camel cased token name", function() {
		href.should.equal( expected );
	} );
} );