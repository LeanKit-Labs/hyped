var should = require( "should" ); // jshint ignore: line
var _ = require( "lodash" );
var when = require( "when" );
var model = require( "./model.js" );
var request = require( "request" );

var board1 = model.board1;
var board2 = model.board2;
var deepCompare = model.deepCompare;

describe( "with oldest version as default", function() {
	var autohost = require( "autohost" );
	var hyped;
	before( function( done ) {
		hyped = require( "../src/index.js" )();
		autohost.init( { resources: "./spec/ah", noOptions: true, urlStrategy: hyped.urlStrategy } ) // just roll with the defaults...
			.then( hyped.addResources )
			.then( done );
		hyped.setupMiddleware( autohost );
	} );

	describe( "when requesting board with no media type", function() {

		var body, contentType;

		before( function( done ) {
			request( "http://localhost:8800/api/board/100", function( err, res ) {
				body = res.body;
				contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
				done();
			} );
		} );

		it( "should get JSON version 1", function() {
			contentType.should.equal( "application/json" );
			body.should.equal( '{"id":100,"title":"Test Board","lanes":[{"id":200,"title":"To Do","wip":0,"cards":[{"id":301,"title":"Card 1","description":"This is card 1"},{"id":302,"title":"Card 2","description":"This is card 2"},{"id":303,"title":"Card 3","description":"This is card 3"}]},{"id":201,"title":"Doing","wip":0,"cards":[{"id":304,"title":"Card 4","description":"This is card 4"}]},{"id":202,"title":"Done","wip":0,"cards":[{"id":305,"title":"Card 5","description":"This is card 5"},{"id":306,"title":"Card 6","description":"This is card 6"}]}]}' );
		} );
	} );

	describe( "when requesting board hal version 2", function() {

		var body, contentType, elapsedMs;

		before( function( done ) {
			var start = Date.now();
			request.get( "http://localhost:8800/api/board/100", { headers: { accept: "application/hal.v2+json" } }, function( err, res ) {
				elapsedMs = ( Date.now() - start );
				body = res.body;
				contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
				done();
			} );
		} );

		it( "should get HAL version 2", function() {
			contentType.should.equal( "application/hal.v2+json" );
			body
				.replace( /\s*/g, "" )
				.should.equal( '{"id":100,"title":"TestBoard","description":"Thisisaboardandstuff!","_origin":{"href":"/api/board/100","method":"GET"},"_links":{"self":{"href":"/api/board/100","method":"GET"}},"_embedded":{"lanes":[{"id":200,"title":"ToDo","wip":0,"_origin":{"href":"/api/board/100/lane/200","method":"GET"},"_links":{"self":{"href":"/api/board/100/lane/200","method":"GET"},"cards":{"href":"/api/board/100/lane/200/card","method":"GET"}},"_embedded":{"cards":[{"id":301,"title":"Card1","description":"Thisiscard1","_origin":{"href":"/api/card/301","method":"GET"},"_links":{"self":{"href":"/api/card/301","method":"GET"},"move":{"href":"/api/card/301/board/:boardId/lane/:laneId","method":"PUT","templated":true},"block":{"href":"/api/card/301/block","method":"PUT"}}},{"id":302,"title":"Card2","description":"Thisiscard2","_origin":{"href":"/api/card/302","method":"GET"},"_links":{"self":{"href":"/api/card/302","method":"GET"},"move":{"href":"/api/card/302/board/:boardId/lane/:laneId","method":"PUT","templated":true},"block":{"href":"/api/card/302/block","method":"PUT"}}},{"id":303,"title":"Card3","description":"Thisiscard3","_origin":{"href":"/api/card/303","method":"GET"},"_links":{"self":{"href":"/api/card/303","method":"GET"},"move":{"href":"/api/card/303/board/:boardId/lane/:laneId","method":"PUT","templated":true},"block":{"href":"/api/card/303/block","method":"PUT"}}}]}},{"id":201,"title":"Doing","wip":0,"_origin":{"href":"/api/board/100/lane/201","method":"GET"},"_links":{"self":{"href":"/api/board/100/lane/201","method":"GET"},"cards":{"href":"/api/board/100/lane/201/card","method":"GET"}},"_embedded":{"cards":[{"id":304,"title":"Card4","description":"Thisiscard4","_origin":{"href":"/api/card/304","method":"GET"},"_links":{"self":{"href":"/api/card/304","method":"GET"},"move":{"href":"/api/card/304/board/:boardId/lane/:laneId","method":"PUT","templated":true},"block":{"href":"/api/card/304/block","method":"PUT"}}}]}},{"id":202,"title":"Done","wip":0,"_origin":{"href":"/api/board/100/lane/202","method":"GET"},"_links":{"self":{"href":"/api/board/100/lane/202","method":"GET"},"cards":{"href":"/api/board/100/lane/202/card","method":"GET"}},"_embedded":{"cards":[{"id":305,"title":"Card5","description":"Thisiscard5","_origin":{"href":"/api/card/305","method":"GET"},"_links":{"self":{"href":"/api/card/305","method":"GET"},"move":{"href":"/api/card/305/board/:boardId/lane/:laneId","method":"PUT","templated":true},"block":{"href":"/api/card/305/block","method":"PUT"}}},{"id":306,"title":"Card6","description":"Thisiscard6","_origin":{"href":"/api/card/306","method":"GET"},"_links":{"self":{"href":"/api/card/306","method":"GET"},"move":{"href":"/api/card/306/board/:boardId/lane/:laneId","method":"PUT","templated":true},"block":{"href":"/api/card/306/block","method":"PUT"}}}]}}]}}' );
		} );

		it( "should be 'quick'", function() {
			elapsedMs.should.be.below( 10 );
		} );
	} );

	describe( "when requesting board json version 2", function() {

		var body, contentType, elapsedMs;

		before( function( done ) {
			var start = Date.now();
			request.get( "http://localhost:8800/api/board/100", { headers: { accept: "application/json.v2" } }, function( err, res ) {
				elapsedMs = ( Date.now() - start );
				body = res.body;
				contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
				done();
			} );
		} );

		it( "should get JSON version 2", function() {
			contentType.should.equal( "application/json.v2" );
			body.should.equal( '{"id":100,"title":"Test Board","description":"This is a board and stuff!","lanes":[{"id":200,"title":"To Do","wip":0,"cards":[{"id":301,"title":"Card 1","description":"This is card 1"},{"id":302,"title":"Card 2","description":"This is card 2"},{"id":303,"title":"Card 3","description":"This is card 3"}]},{"id":201,"title":"Doing","wip":0,"cards":[{"id":304,"title":"Card 4","description":"This is card 4"}]},{"id":202,"title":"Done","wip":0,"cards":[{"id":305,"title":"Card 5","description":"This is card 5"},{"id":306,"title":"Card 6","description":"This is card 6"}]}]}' );
		} );

		it( "should be 'quick'", function() {
			elapsedMs.should.be.below( 10 );
		} );
	} );

	describe( "when requesting board json with no version specifier", function() {

		var body, contentType, elapsedMs;

		before( function( done ) {
			var start = Date.now();
			elapsedMs = ( Date.now() - start );
			request.get( "http://localhost:8800/api/board/100", { headers: { accept: "application/hal+json" } }, function( err, res ) {
				body = res.body;
				contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
				done();
			} );
		} );

		it( "should get HAL version 1", function() {
			contentType.should.equal( "application/hal+json" );
			body
				.replace( /\s*/g, "" )
				.should.equal( '{"id":100,"title":"TestBoard","_origin":{"href":"/api/board/100","method":"GET"},"_links":{"self":{"href":"/api/board/100","method":"GET"}},"_embedded":{"lanes":[{"id":200,"title":"ToDo","wip":0,"_origin":{"href":"/api/board/100/lane/200","method":"GET"},"_links":{"self":{"href":"/api/board/100/lane/200","method":"GET"},"cards":{"href":"/api/board/100/lane/200/card","method":"GET"}},"_embedded":{"cards":[{"id":301,"title":"Card1","description":"Thisiscard1","_origin":{"href":"/api/card/301","method":"GET"},"_links":{"self":{"href":"/api/card/301","method":"GET"},"move":{"href":"/api/card/301/board/:boardId/lane/:laneId","method":"PUT","templated":true},"block":{"href":"/api/card/301/block","method":"PUT"}}},{"id":302,"title":"Card2","description":"Thisiscard2","_origin":{"href":"/api/card/302","method":"GET"},"_links":{"self":{"href":"/api/card/302","method":"GET"},"move":{"href":"/api/card/302/board/:boardId/lane/:laneId","method":"PUT","templated":true},"block":{"href":"/api/card/302/block","method":"PUT"}}},{"id":303,"title":"Card3","description":"Thisiscard3","_origin":{"href":"/api/card/303","method":"GET"},"_links":{"self":{"href":"/api/card/303","method":"GET"},"move":{"href":"/api/card/303/board/:boardId/lane/:laneId","method":"PUT","templated":true},"block":{"href":"/api/card/303/block","method":"PUT"}}}]}},{"id":201,"title":"Doing","wip":0,"_origin":{"href":"/api/board/100/lane/201","method":"GET"},"_links":{"self":{"href":"/api/board/100/lane/201","method":"GET"},"cards":{"href":"/api/board/100/lane/201/card","method":"GET"}},"_embedded":{"cards":[{"id":304,"title":"Card4","description":"Thisiscard4","_origin":{"href":"/api/card/304","method":"GET"},"_links":{"self":{"href":"/api/card/304","method":"GET"},"move":{"href":"/api/card/304/board/:boardId/lane/:laneId","method":"PUT","templated":true},"block":{"href":"/api/card/304/block","method":"PUT"}}}]}},{"id":202,"title":"Done","wip":0,"_origin":{"href":"/api/board/100/lane/202","method":"GET"},"_links":{"self":{"href":"/api/board/100/lane/202","method":"GET"},"cards":{"href":"/api/board/100/lane/202/card","method":"GET"}},"_embedded":{"cards":[{"id":305,"title":"Card5","description":"Thisiscard5","_origin":{"href":"/api/card/305","method":"GET"},"_links":{"self":{"href":"/api/card/305","method":"GET"},"move":{"href":"/api/card/305/board/:boardId/lane/:laneId","method":"PUT","templated":true},"block":{"href":"/api/card/305/block","method":"PUT"}}},{"id":306,"title":"Card6","description":"Thisiscard6","_origin":{"href":"/api/card/306","method":"GET"},"_links":{"self":{"href":"/api/card/306","method":"GET"},"move":{"href":"/api/card/306/board/:boardId/lane/:laneId","method":"PUT","templated":true},"block":{"href":"/api/card/306/block","method":"PUT"}}}]}}]}}' );
		} );

		it( "should be 'quick'", function() {
			elapsedMs.should.be.below( 10 );
		} );
	} );

	describe( "when requesting an unsupported media type", function() {
		var body, contentType, elapsedMs, status;

		before( function( done ) {
			var start = Date.now();
			elapsedMs = ( Date.now() - start );
			request.get( "http://localhost:8800/api/board/100", { headers: { accept: "application/vnd.baconated+json" } }, function( err, res ) {
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

		it( "should be 'quick'", function() {
			elapsedMs.should.be.below( 10 );
		} );
	} );

	describe( "when requesting lane self action", function() {
		var body, contentType, elapsedMs, status;

		before( function( done ) {
			var start = Date.now();
			elapsedMs = ( Date.now() - start );
			request.get( "http://localhost:8800/api/board/100/lane/200", { headers: { accept: "application/json" } }, function( err, res ) {
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
			json.should.eql( board1.lanes[ 0 ] );
		} );
	} );

	describe( "when hitting root with options verb", function() {
		var body, contentType, elapsedMs;

		var expectedOptions = {
			_autohost: 
			 { api: { href: "/api/_autohost", method: "GET" },
				 resources: { href: "/api/_autohost/resource", method: "GET" },
				 actions: { href: "/api/_autohost/action", method: "GET" },
				 "connected-sockets": { href: "/api/_autohost/sockets", method: "GET" },
				 "list-users": { href: "/api/_autohost/user", method: "GET" },
				 "list-roles": { href: "/api/_autohost/role", method: "GET" },
				 "list-user-roles": { href: "/api/_autohost/user/:user/role", method: "GET", templated: true },
				 "list-action-roles": { href: "/api/_autohost/action/:action/role", method: "GET", templated: true },
				 "add-action-roles":  { href: "/api/_autohost/action/:action/role", method: "PATCH", templated: true },
				 "remove-action-roles": { href: "/api/_autohost/action/:action/role", method: "DELETE", templated: true },
				 "add-user-roles": { href: "/api/_autohost/user/:user/role", method: "PATCH", templated: true },
				 "remove-user-roles":  { href: "/api/_autohost/user/:user/role", method: "DELETE", templated: true },
				 "add-role": { href: "/api/_autohost/role/:role", method: "POST", templated: true },
				 "remove-role": { href: "/api/_autohost/role/:role", method: "DELETE", templated: true },
				 "create-user": { href: "/api/_autohost/user/:userName", method: "POST", templated: true },
				 "change-password": { href: "/api/_autohost/user/:userName", method: "PATCH", templated: true },
				 "create-token": { href: "/api/_autohost/token", method: "POST" },
				 "destroy-token": { href: "/api/_autohost/token/:token", method: "DELETE", templated: true },
				 "list-tokens": { href: "/api/_autohost/token/", method: "GET" },
				 "enable-user": { href: "/api/_autohost/user/:userName", method: "PUT", templated: true },
				 "disable-user": { href: "/api/_autohost/user/:userName", method: "DELETE", templated: true },
				 metrics: { href: "/api/_autohost/metrics", method: "GET" } },
			board: { 
				self: { href: "/api/board/:id", method: "GET", templated: true } 
			},
			card: { 
				self: { href: "/api/card/:id", method: "GET", templated: true },
				move: { href: "/api/card/:id/board/:boardId/lane/:laneId", method: "PUT", templated: true },
				 block: { href: "/api/card/:id/block", method: "PUT", templated: true }
			},
			lane: { 
				self: { href: "/api/board/:id/lane/:laneId", method: "GET", templated: true },
				cards: { href: "/api/board/:id/lane/:laneId/card", method: "GET", templated: true }
			},
			_mediaTypes: [ "application/json", "application/hal+json" ],
			_versions: [ "1", "2" ]
		};

		before( function( done ) {
			var start = Date.now();
			elapsedMs = ( Date.now() - start );
			request( { method: "OPTIONS", url: "http://localhost:8800/api" }, function( err, res ) {
				body = res.body;
				contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
				done();
			} );
		} );

		it( "should get options", function() {
			contentType.should.equal( "application/json" );
			var json = JSON.parse( body );
			json.should.eql( expectedOptions );
		} );

		it( "should be 'quick'", function() {
			elapsedMs.should.be.below( 10 );
		} );
	} );

	after( function() {
		autohost.stop();
	} );
} );

describe( "with newest version as default", function() {
	var autohost = require( "autohost" );
	var hyped;
	before( function( done ) {
		hyped = require( "../src/index.js" )( true );
		autohost.init( { resources: "./spec/ah", noOptions: true, urlStrategy: hyped.urlStrategy } ) // just roll with the defaults...
			.then( hyped.addResources )
			.then( done );
		hyped.setupMiddleware( autohost );
	} );

	describe( "when requesting board with no media type", function() {

		var body, contentType;

		before( function( done ) {
			request( "http://localhost:8800/api/board/100", function( err, res ) {
				body = res.body;
				contentType = res.headers[ "content-type" ].split( ";" )[ 0 ];
				done();
			} );
		} );

		it( "should get JSON version 2", function() {
			contentType.should.equal( "application/json" );
			body.should.equal( '{"id":100,"title":"Test Board","description":"This is a board and stuff!","lanes":[{"id":200,"title":"To Do","wip":0,"cards":[{"id":301,"title":"Card 1","description":"This is card 1"},{"id":302,"title":"Card 2","description":"This is card 2"},{"id":303,"title":"Card 3","description":"This is card 3"}]},{"id":201,"title":"Doing","wip":0,"cards":[{"id":304,"title":"Card 4","description":"This is card 4"}]},{"id":202,"title":"Done","wip":0,"cards":[{"id":305,"title":"Card 5","description":"This is card 5"},{"id":306,"title":"Card 6","description":"This is card 6"}]}]}' );
		} );

	} );

	after( function() {
		autohost.stop();
	} );
} );