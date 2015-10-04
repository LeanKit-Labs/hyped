require( "../setup" );

var HyperResponse = require( "../../src/hyperResponse" );

// CAUTION - this particular class synthesizes a lot of various
// inputs to create the hypermedia response. Trying to follow it may
// or may not (but definitely will) give you a headache.
describe( "Hyper Response", function() {
	describe( "when creating response", function() {
		var result, res, resMock;
		before( function() {
			// transport request fake
			var req = {
				_resource: "test",
				_action: "self",
				context: {
					middlewareData: "secret"
				},
				extendHttp: {
				}
			};

			// model - data property on hash returned from handler
			var model = {
				id: 1,
				title: "ohhai",
				description: "uh, just some thing"
			};

			// full hash returned from handler
			var handleResult = {
				status: 200,
				data: model,
				headers: {
					custom: "yay, a goat!"
				},
				cookies: {
					cookieMonster: "umnumnumnumnum"
				}
			};

			// transport response mock
			res = {
				set: _.noop,
				cookie: _.noop,
				status: _.noop,
				send: _.noop
			};
			resMock = sinon.mock( res );
			resMock
				.expects( "set" )
				.withArgs( "Content-Type", "application/json" )
				.once();

			resMock
				.expects( "set" )
				.withArgs( "custom", "yay, a goat!" )
				.once();

			res.cookie( "cookieMonster", "umnumnumnumnum" );
			resMock.expects( "status" )
				.once()
				.withArgs( 200 )
				.returns( res );

			resMock.expects( "send" )
				.once()
				.withArgs( model );

			// engine just returns the data passed to it
			var engine = function( x ) {
				return x;
			};
			var contentType = "application/json";

			// just mock the hyper resource
			var hyperResource = sinon.mock();
			hyperResource.withArgs(
				"test",
				"self",
				model,
				"",
				{
					middlewareData: "secret"
				},
				"/test",
				"GET"
			)
			.twice() // twice because we call it, then render calls it
			.returns( model );

			var response = new HyperResponse( req, res, engine, hyperResource, contentType );
			response.origin( "/test", "GET" );
			result = req.extendHttp.render( {}, undefined, undefined, handleResult );
			response.render();
		} );

		it( "should produce the exepcted result", function() {
			result.should.eql( {
				status: 200,
				headers: {
					"Content-Type": "application/json",
					custom: "yay, a goat!"
				},
				cookies: {
					cookieMonster: "umnumnumnumnum"
				},
				data: {
					id: 1,
					title: "ohhai",
					description: "uh, just some thing"
				}
			} );
		} );

		it( "should render correctly", function() {
			resMock.verify();
		} );
	} );
} );
