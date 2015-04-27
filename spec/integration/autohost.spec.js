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
					done();
				} );
		} );

		describe( "when requesting board with no media type", function() {

			var body, contentType;

			before( function( done ) {
				request( "http://localhost:8800/test/api/board/100", function( err, res ) {
					body = JSON.parse( res.body );
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			it( "should get JSON version 1", function() {
				contentType.should.equal( "application/json" );
				body.should.eql( { "id": 100, "title": "Test Board", "lanes": [ { "id": 200, "title": "To Do", "wip": 0, "cards": [ { "id": 301, "title": "Card 1", "description": "This is card 1" }, { "id": 302, "title": "Card 2", "description": "This is card 2" }, { "id": 303, "title": "Card 3", "description": "This is card 3" } ] }, { "id": 201, "title": "Doing", "wip": 0, "cards": [ { "id": 304, "title": "Card 4", "description": "This is card 4" } ] }, { "id": 202, "title": "Done", "wip": 0, "cards": [ { "id": 305, "title": "Card 5", "description": "This is card 5" }, { "id": 306, "title": "Card 6", "description": "This is card 6" } ] } ] } );
			} );
		} );

		describe( "when requesting board hal version 2", function() {

			var body, contentType, elapsedMs;

			var expectedJson = require( "./halBoard2.json" );

			before( function( done ) {
				var start = Date.now();
				request.get( "http://localhost:8800/test/api/board/100", { headers: { accept: "application/hal.v2+json" } }, function( err, res ) {
					elapsedMs = ( Date.now() - start );
					body = res.body;
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			it( "should get HAL version 2", function() {
				contentType.should.equal( "application/hal.v2+json" );
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
				contentType.should.equal( "text/html" );
				status.should.equal( 415 );
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
					done();
				} );
		} );

		describe( "when requesting board with no media type", function() {
			var expected = require( "./board2.json" );
			var body, contentType;

			before( function( done ) {
				request( "http://localhost:8800/api/board/100", function( err, res ) {
					body = JSON.parse( res.body );
					contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
					done();
				} );
			} );

			it( "should get JSON version 2", function() {
				contentType.should.equal( "application/json" );
				body.should.eql( expected );
			} );

		} );

		after( function() {
			host.stop();
		} );
	} );

} );
