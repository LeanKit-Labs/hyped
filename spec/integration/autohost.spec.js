require( "../setup" );
var model = require( "../model.js" );
var request = require( "request" );
var autohost = require( "autohost" );
var board1 = model.board1;

describe( "Autohost Integration", function() {
	describe( "with oldest version as default", function() {
		var hyped, host;
		before( function( done ) {
			hyped = require( "../../src/index.js" )( false, true );
			host = hyped.createHost( autohost, {
				urlPrefix: "/test",
				resources: "./spec/ah"
			}, function() {
					host.http.middleware( "/", function context( req, res, next ) {
						req.context.test = {
							message: "I came from middleware!"
						};
						next();
					} );
					host.start();
					done();
				} );
		} );

		describe( "when request factors create overlapping properties for envelope", function() {
			var body, contentType;

			before( function( done ) {
				request( "http://localhost:8800/test/api/board/100?id=200&qp=iwin",
					{
						method: "post",
						headers: {
							"content-type": "application/json",
							accept: "application/json; version=11"
						},
						body: {
							id: 300,
							qp: "ilose",
							bp: "iwin"
						},
						json: true
					},
					function( err, res ) {
						body = res.body;
						contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
						done();
					} );
			} );

			it( "should get JSON representation of context", function() {
				contentType.should.equal( "application/json" );
				body.should.eql( {
					merged: {
						id: "100",
						qp: "iwin",
						bp: "iwin"
					},
					params: {
						id: "100",
						qp: "iwin"
					},
					query: {
						id: "200",
						qp: "iwin"
					},
					body: {
						id: 300,
						qp: "ilose",
						bp: "iwin"
					},
					version: 8
				} );
			} );
		} );

		describe( "when altering context", function() {
			var body, contentType;

			before( function( done ) {
				request( "http://localhost:8800/test/prefix/api/test", { headers: { accept: "*/*" } }, function( err, res ) {
					body = JSON.parse( res.body );
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			it( "should get JSON representation of context", function() {
				contentType.should.equal( "application/json" );
				body.should.eql( {
					test: { message: "I came from middleware!" },
					version: 1
				} );
			} );
		} );

		describe( "when requesting board with any media type", function() {
			var body, contentType;

			before( function( done ) {
				request( "http://localhost:8800/test/api/board/100", { headers: { accept: "*/*" } }, function( err, res ) {
					body = JSON.parse( res.body );
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			it( "should get JSON version 1 (default content type and version)", function() {
				contentType.should.equal( "application/json" );
				body.should.eql( { id: 100, title: "Test Board", lanes: [ { id: 200, title: "To Do", wip: 0, cards: [ { id: 301, title: "Card 1", description: "This is card 1" }, { id: 302, title: "Card 2", description: "This is card 2" }, { id: 303, title: "Card 3", description: "This is card 3" } ] }, { id: 201, title: "Doing", wip: 0, cards: [ { id: 304, title: "Card 4", description: "This is card 4" } ] }, { id: 202, title: "Done", wip: 0, cards: [ { id: 305, title: "Card 5", description: "This is card 5" }, { id: 306, title: "Card 6", description: "This is card 6" } ] } ] } );
			} );
		} );

		describe( "when requesting board hal version 2", function() {
			var body, contentType, elapsedMs;
			var expectedJson = require( "./halBoard2.json" );

			before( function( done ) {
				var start = Date.now();
				request.get( "http://localhost:8800/test/api/board/100", { headers: { accept: "application/hal+json; version=2" } }, function( err, res ) {
					elapsedMs = ( Date.now() - start );
					body = res.body;
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			it( "should get HAL version 2", function() {
				contentType.should.equal( "application/hal+json" );
				var json = JSON.parse( body );
				json.should.eql( expectedJson );
			} );
		} );

		describe( "when requesting board json version 2", function() {
			var expected = require( "./board2.json" );
			var body, contentType, elapsedMs;

			before( function( done ) {
				var start = Date.now();
				request.get( "http://localhost:8800/test/api/board/100", { headers: { accept: "application/json.v2" } }, function( err, res ) {
					elapsedMs = ( Date.now() - start );
					body = JSON.parse( res.body );
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			it( "should get JSON version 2", function() {
				contentType.should.equal( "application/json.v2" );
				body.should.eql( expected );
			} );
		} );

		describe( "when requesting intermediate board json version", function() {
			var expected = require( "./board2.json" );
			var body, contentType, elapsedMs;

			before( function( done ) {
				var start = Date.now();
				request.get( "http://localhost:8800/test/api/board/100", { headers: { accept: "application/json.v7" } }, function( err, res ) {
					elapsedMs = ( Date.now() - start );
					body = JSON.parse( res.body );
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			it( "should get JSON version 7", function() {
				contentType.should.equal( "application/json.v7" );
				body.should.eql( expected );
			} );
		} );

		describe( "when requesting board json version 10", function() {
			var expected = { wat: "crazy train" };
			var body, contentType, elapsedMs;

			before( function( done ) {
				var start = Date.now();
				request.get( "http://localhost:8800/test/api/board/100", { headers: { accept: "application/json.v10" } }, function( err, res ) {
					elapsedMs = ( Date.now() - start );
					body = JSON.parse( res.body );
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			it( "should get JSON version 10", function() {
				contentType.should.equal( "application/json.v10" );
				body.should.eql( expected );
			} );
		} );

		describe( "when requesting board hal with no version specifier", function() {
			var body, contentType, elapsedMs;
			var expectedJson = require( "./halBoard.json" );

			before( function( done ) {
				var start = Date.now();
				elapsedMs = ( Date.now() - start );
				request.get( "http://localhost:8800/test/api/board/100", { headers: { accept: "application/hal+json" } }, function( err, res ) {
					body = res.body;
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			it( "should get HAL version 1", function() {
				contentType.should.equal( "application/hal+json" );
				var json = JSON.parse( body );
				json.should.eql( expectedJson );
			} );
		} );

		describe( "when requesting an unsupported media type", function() {
			var body, contentType, elapsedMs, status;

			before( function( done ) {
				var start = Date.now();
				elapsedMs = ( Date.now() - start );
				request.get( "http://localhost:8800/test/api/board/100", { headers: { accept: "application/vnd.baconated+json" } }, function( err, res ) {
					body = res.body;
					status = res.statusCode;
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			it( "should get 415", function() {
				status.should.equal( 415 );
				contentType.should.equal( "text/plain" );
				body.should.equal( "The requested media type 'application/vnd.baconated+json' is not supported. Please see the OPTIONS at the api root to get a list of supported types." );
			} );
		} );

		describe( "when requesting lane self action as JSON", function() {
			var body, contentType, elapsedMs, status;

			before( function( done ) {
				var start = Date.now();
				elapsedMs = ( Date.now() - start );
				request.get( "http://localhost:8800/test/api/board/100/lane/200", { headers: { accept: "application/json" } }, function( err, res ) {
					body = res.body;
					status = res.statusCode;
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			it( "should be correct media type", function() {
				contentType.should.equal( "application/json" );
			} );

			it( "should get lane back", function() {
				var json = JSON.parse( body );
				json.should.eql( _.omit( board1.lanes[ 0 ], [ "board", "boardId" ] ) );
			} );
		} );

		describe( "when requesting lane self action as HAL", function() {
			var body, contentType, elapsedMs, status;

			before( function( done ) {
				var start = Date.now();
				elapsedMs = ( Date.now() - start );
				request.get( "http://localhost:8800/test/api/board/100/lane/201", { headers: { accept: "application/hal+json" } }, function( err, res ) {
					body = res.body;
					status = res.statusCode;
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			var expectedLane = require( "./halLane.json" );

			it( "should be correct media type", function() {
				contentType.should.equal( "application/hal+json" );
			} );

			it( "should get lane back", function() {
				var json = JSON.parse( body );
				json.should.eql( expectedLane );
			} );
		} );

		describe( "when rendering related list of resources as hal", function() {
			var body, contentType, elapsedMs;
			var expected = require( "./halCards.json" );

			before( function( done ) {
				var start = Date.now();
				request.get( "http://localhost:8800/test/api/board/100/card", { headers: { accept: "application/hal+json" } }, function( err, res ) {
					elapsedMs = ( Date.now() - start );
					body = res.body;
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			it( "should get HAL", function() {
				contentType.should.equal( "application/hal+json" );
				var json = JSON.parse( body );
				json.should.eql( expected );
			} );
		} );

		describe( "when rendering an endpoint with an rejected promise", function() {
			var body, contentType, elapsedMs, httpStatus;
			var expected = require( "./halCards.json" );

			before( function( done ) {
				var start = Date.now();
				request.get( "http://localhost:8800/test/prefix/api/test/reject", { headers: { accept: "application/hal+json" } }, function( err, res ) {
					elapsedMs = ( Date.now() - start );
					body = res.body;
					httpStatus = res.statusCode;
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			it( "should not hang and should still return", function() {
				contentType.should.equal( "application/hal+json" );
				var json = JSON.parse( body );
				httpStatus.should.equal( 500 );
				json.should.eql( {
					_action: "reject",
					_origin: {
						href: "/test/prefix/api/test/reject",
						method: "GET"
					},
					_resource: "test",
					_version: 1,
					message: "Server error"
				} );
			} );
		} );

		describe( "when rendering an endpoint with an empty response", function() {
			var body, contentType, httpStatus;

			before( function( done ) {
				request.del( "http://localhost:8800/test/api/card/123", { headers: { accept: "application/hal+json" } }, function( err, res ) {
					body = res.body;
					httpStatus = res.statusCode;
					contentType = res.headers[ "content-type" ];
					done();
				} );
			} );

			it( "should have an empty response", function() {
				body.should.equal( "" );
				should.not.exist( contentType );
				httpStatus.should.equal( 204 );
			} );
		} );

		describe( "when hitting root with options verb", function() {
			var body, contentType, elapsedMs;
			var expectedOptions = require( "./halOptions.json" );

			before( function( done ) {
				var start = Date.now();
				elapsedMs = ( Date.now() - start );
				request( { method: "OPTIONS", url: "http://localhost:8800/test/api" }, function( err, res ) {
					body = res.body;
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			it( "should get options", function() {
				contentType.should.equal( "application/json" );
				var json = JSON.parse( body );
				delete json._links[ "ah:metrics" ];
				json.should.eql( expectedOptions );
			} );
		} );

		describe( "when hitting root with options verb and the options change between requests", function() {
			var body, contentType, secondBody, secondContentType;
			var expectedOptions = require( "./halOptions.json" );
			var moreExpectedOptions = require( "./halOptionsMore.json" );

			before( function( done ) {
				request( { method: "OPTIONS", url: "http://localhost:8800/test/api" }, function( err, res ) {
					body = res.body;
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];

					request( {
						method: "OPTIONS",
						url: "http://localhost:8800/test/api",
						headers: { "x-show-me-more": "true" }
					}, function( err, res ) {
						secondBody = res.body;
						secondContentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
						done();
					} );
				} );
			} );

			it( "should get options", function() {
				contentType.should.equal( "application/json" );
				var json = JSON.parse( body );
				delete json._links[ "ah:metrics" ];
				json.should.eql( expectedOptions );
			} );

			it( "should get the additional link on the second call", function() {
				secondContentType.should.equal( "application/json" );
				var json = JSON.parse( secondBody );
				delete json._links[ "ah:metrics" ];
				json.should.eql( moreExpectedOptions );
			} );
		} );

		after( function() {
			host.stop();
		} );
	} );

	describe( "with newest version as default", function() {
		var hyped, host;
		before( function( done ) {
			hyped = require( "../../src/index.js" )( true, true );
			host = hyped.createHost( autohost, {
				resources: "./spec/ah"
			}, function() {
					host.start();
					done();
				} );
		} );

		describe( "when requesting board with no media type", function() {
			var expected = { wat: "crazy train" };
			var body, contentType;

			before( function( done ) {
				request( "http://localhost:8800/api/board/train/100", function( err, res ) {
					body = JSON.parse( res.body );

					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			it( "should get version 10's hot nonsense", function() {
				contentType.should.equal( "application/json" );
				body.should.eql( expected );
			} );
		} );

		after( function() {
			host.stop();
		} );
	} );

	describe( "with hal as default content type", function() {
		var hyped, host;
		before( function( done ) {
			hyped = require( "../../src/index.js" )( {
				defaultContentType: "application/hal+json"
			} );
			host = hyped.createHost( autohost, {
				urlPrefix: "/test",
				resources: "./spec/ah"
			}, function() {
					host.start();
					done();
				} );
		} );

		describe( "when requesting board with any media type", function() {
			var body, contentType;
			var expectedJson = require( "./halBoard.json" );

			before( function( done ) {
				request( "http://localhost:8800/test/api/board/100", { headers: { accept: "*/*" } }, function( err, res ) {
					body = JSON.parse( res.body );
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			it( "should get HAL version 1 (default content type and version)", function() {
				contentType.should.equal( "application/hal+json" );
				body.should.eql( expectedJson );
			} );
		} );

		describe( "when requesting an unsupported media type", function() {
			var body, contentType, elapsedMs, status;

			before( function( done ) {
				var start = Date.now();
				elapsedMs = ( Date.now() - start );
				request.get( "http://localhost:8800/test/api/board/100", { headers: { accept: "application/vnd.baconated+json" } }, function( err, res ) {
					body = res.body;
					status = res.statusCode;
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			it( "should get 415", function() {
				status.should.equal( 415 );
				contentType.should.equal( "text/plain" );
				body.should.equal( "The requested media type 'application/vnd.baconated+json' is not supported. Please see the OPTIONS at the api root to get a list of supported types." );
			} );
		} );

		after( function() {
			host.stop();
		} );
	} );

	describe( "with versioned authorization calls", function() {
		var hyped, host;
		before( function( done ) {
			hyped = require( "../../src/index.js" )( {
				defaultContentType: "application/hal+json"
			} );
			host = hyped.createHost( autohost, {
				urlPrefix: "/test",
				resources: "./spec/ah"
			}, function() {
					host.start();
					done();
				} );
		} );

		describe( "when requesting with version 1 and adequate authorization", function() {
			var body, contentType;

			before( function( done ) {
				request( "http://localhost:8800/test/api/secure?level=2",
						{ headers: { accept: "*/*" } },
						function( err, res ) {
							body = JSON.parse( res.body );
							contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
							done();
						} );
			}
		);

			it( "should get HAL version 1 (default content type and version)", function() {
				contentType.should.equal( "application/hal+json" );
				body.result.should.eql( "level 1" );
			} );
		} );

		describe( "when requesting with version 1 and inadequate authorization", function() {
			var body, contentType;

			before( function( done ) {
				request( "http://localhost:8800/test/api/secure?level=1",
						{ headers: { accept: "*/*" } },
						function( err, res ) {
							body = JSON.parse( res.body );
							contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
							done();
						} );
			}
		);

			it( "should get HAL version 1 (default content type and version)", function() {
				contentType.should.equal( "application/hal+json" );
				body.message.should.eql( "User lacks sufficient permissions" );
			} );
		} );

		describe( "when requesting with version 2 and adequate authorization", function() {
			var body, contentType;

			before( function( done ) {
				request( "http://localhost:8800/test/api/secure?level=3",
						{ headers: { accept: "application/hal.v2+json" } },
						function( err, res ) {
							body = JSON.parse( res.body );
							contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
							done();
						} );
			}
		);

			it( "should get HAL version 2 (default content type and version)", function() {
				contentType.should.equal( "application/hal.v2+json" );
				body.result.should.eql( "level 2" );
			} );
		} );

		describe( "when requesting with version 2 and inadequate authorization", function() {
			var body, contentType;

			before( function( done ) {
				request( "http://localhost:8800/test/api/secure?level=2",
						{ headers: { accept: "application/hal.v2+json" } },
						function( err, res ) {
							body = JSON.parse( res.body );
							contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
							done();
						} );
			}
		);

			it( "should get HAL version 2 (default content type and version)", function() {
				contentType.should.equal( "application/hal.v2+json" );
				body.message.should.eql( "User lacks sufficient permissions" );
			} );
		} );

		after( function() {
			host.stop();
		} );
	} );

	describe( "with undefined api prefix and latest version as default", function() {
		var hyped, host;
		before( function( done ) {
			hyped = require( "../../src/index.js" )( true, true );
			host = hyped.createHost( autohost, {
				resources: "./spec/ah",
				apiPrefix: undefined
			}, function() {
					host.start();
					done();
				} );
		} );

		describe( "when requesting board with no media type", function() {
			var expected = { wat: "crazy train" };
			var body, contentType;

			before( function( done ) {
				request( "http://localhost:8800/board/100", function( err, res ) {
					body = JSON.parse( res.body );
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			it( "should get version 10's hot nonsense", function() {
				contentType.should.equal( "application/json" );
				body.should.eql( expected );
			} );
		} );

		describe( "when hitting root with options verb", function() {
			var body, contentType, elapsedMs;

			var expectedOptions = require( "./halOptionsNoPrefix.json" );

			before( function( done ) {
				var start = Date.now();
				elapsedMs = ( Date.now() - start );
				request( { method: "OPTIONS", url: "http://localhost:8800" }, function( err, res ) {
					body = res.body;
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			it( "should get options", function() {
				contentType.should.equal( "application/json" );
				var json = JSON.parse( body );
				delete json._links[ "ah:metrics" ];
				json.should.eql( expectedOptions );
			} );
		} );

		after( function() {
			host.stop();
		} );
	} );

	describe( "with empty api prefix", function() {
		var hyped, host;
		before( function( done ) {
			hyped = require( "../../src/index.js" )( true, true );
			host = hyped.createHost( autohost, {
				resources: "./spec/ah",
				apiPrefix: ""
			}, function() {
					host.start();
					done();
				} );
		} );

		describe( "when requesting board with no media type", function() {
			var expected = { wat: "crazy train" };
			var body, contentType;

			before( function( done ) {
				request( "http://localhost:8800/board/100", function( err, res ) {
					body = JSON.parse( res.body );
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			it( "should get version 10's hot nonsense", function() {
				contentType.should.equal( "application/json" );
				body.should.eql( expected );
			} );
		} );

		describe( "when hitting root with options verb", function() {
			var body, contentType, elapsedMs;

			var expectedOptions = require( "./halOptionsNoPrefix.json" );

			before( function( done ) {
				var start = Date.now();
				elapsedMs = ( Date.now() - start );
				request( { method: "OPTIONS", url: "http://localhost:8800" }, function( err, res ) {
					body = res.body;
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			it( "should get options", function() {
				contentType.should.equal( "application/json" );
				var json = JSON.parse( body );
				delete json._links[ "ah:metrics" ];
				json.should.eql( expectedOptions );
			} );
		} );

		after( function() {
			host.stop();
		} );
	} );

	describe( "with preInit as callback", function() {
		var hyped, host, globalCalled;
		before( function( done ) {
			hyped = require( "../../src/index.js" )( true, true );
			host = hyped.createHost( autohost, {
				resources: "./spec/ah",
				apiPrefix: "",
				preInit: function( host, callback ) {
					host.http.middleware( "/", function( req, res, next ) {
						globalCalled = true;
						next();
					}, "global" );
					callback();
				}
			}, function() {
					host.start();
					done();
				} );
		} );

		it( "should invoke global middleware added during preInit", function( done ) {
			request( "http://localhost:8800/board/100", function( err, res ) {
				globalCalled.should.equal( true );
				done();
			} );
		} );

		after( function() {
			host.stop();
		} );
	} );

	describe( "with preInit as promise", function() {
		var hyped, host, globalCalled;
		before( function( done ) {
			hyped = require( "../../src/index.js" )( true, true );
			host = hyped.createHost( autohost, {
				resources: "./spec/ah",
				apiPrefix: "",
				preInit: function( host ) {
					host.http.middleware( "/", function( req, res, next ) {
						globalCalled = true;
						next();
					}, "global" );
					return when.resolve();
				}
			}, function() {
					host.start();
					done();
				} );
		} );

		it( "should invoke global middleware added during preInit", function( done ) {
			request( "http://localhost:8800/board/100", function( err, res ) {
				globalCalled.should.equal( true );
				done();
			} );
		} );

		after( function() {
			host.stop();
		} );
	} );
} );
