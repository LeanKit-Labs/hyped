var should = require( "should" ); // jshint ignore: line
var _ = require( "lodash" );
var model = require( "./model.js" );
var request = require( "request" );

var board1 = model.board1;
var limit = 10;

describe( "with oldest version as default", function() {
	var autohost = require( "autohost" );
	var hyped;
	before( function( done ) {
		hyped = require( "../src/index.js" )( false, true );
		autohost.init( { 
				resources: "./spec/ah", 
				noOptions: true, 
				urlPrefix: "/test",
				urlStrategy: hyped.urlStrategy 
			} ) // just roll with the defaults...
			.then( hyped.addResources )
			.then( done );
		hyped.setupMiddleware( autohost );
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
			body.should.eql( {"id":100,"title":"Test Board","lanes":[{"id":200,"title":"To Do","wip":0,"cards":[{"id":301,"title":"Card 1","description":"This is card 1"},{"id":302,"title":"Card 2","description":"This is card 2"},{"id":303,"title":"Card 3","description":"This is card 3"}]},{"id":201,"title":"Doing","wip":0,"cards":[{"id":304,"title":"Card 4","description":"This is card 4"}]},{"id":202,"title":"Done","wip":0,"cards":[{"id":305,"title":"Card 5","description":"This is card 5"},{"id":306,"title":"Card 6","description":"This is card 6"}]}]} );
		} );
	} );

	describe( "when requesting board hal version 2", function() {

		var body, contentType, elapsedMs;

		var expectedJson = {
			id: 100,
			title: "Test Board",
			description: "This is a board and stuff!",
			_origin: {
				href: "/test/api/board/100",
				method: "GET"
			},
			_links: {
				self: {
					href: "/test/api/board/100",
					method: "GET"
				},
				cards: {
					href: "/test/api/board/100/card",
					method: "GET"
				}
			},
			_embedded: {
				lanes: [ 
					{ 
						id: 200,
						title: "To Do",
						wip: 0,
						_origin: {
							href: "/test/api/board/100/lane/200",
							method: "GET"
						},
						_links: {
							self: {
								href: "/test/api/board/100/lane/200",
								method: "GET"
							},
							cards: {
								href: "/test/api/board/100/lane/200/card",
								method: "GET"
							}
						},
						_embedded: {
							cards: [ 
								{ 
									id: 301,
									title: "Card 1",
									description: "This is card 1",
									_origin: {
										href: "/test/api/card/301",
										method: "GET"
									},
									_links: {
										self: {
											href: "/test/api/card/301",
											method: "GET"
										},
										move: {
											href: "/test/api/card/301/board/{boardId}/lane/{laneId}",
											method: "PUT",
											templated: true
										},
										block: {
											href: "/test/api/card/301/block",
											method: "PUT"
										}
									}
								},
								{
									id: 302,
									title: "Card 2",
									description: "This is card 2",
									_origin: {
										href: "/test/api/card/302",
										method: "GET"
									},
									_links: {
										self: {
											href: "/test/api/card/302",
											method: "GET"
										},
										move: {
											href: "/test/api/card/302/board/{boardId}/lane/{laneId}",
											method: "PUT",
											templated: true
										},
										block: {
											href: "/test/api/card/302/block",
											method: "PUT"
										}
									}
								},
								{
									id: 303,
									title: "Card 3",
									description: "This is card 3",
									_origin: {
										href: "/test/api/card/303",
										method: "GET"
									},
									_links: {
										self: {
											href: "/test/api/card/303",
											method: "GET"
										},
										move: {
											href: "/test/api/card/303/board/{boardId}/lane/{laneId}",
											method: "PUT",
											templated: true
										},
										block: {
											href: "/test/api/card/303/block",
											method: "PUT"
										}
									}
								} 
							]
						}
					},
					{
						id: 201,
						title: "Doing",
						wip: 0,
						_origin: {
							href: "/test/api/board/100/lane/201",
							method: "GET"
						},
						_links: {
							self: {
								href: "/test/api/board/100/lane/201",
								method: "GET"
							},
							cards: {
								href: "/test/api/board/100/lane/201/card",
								method: "GET"
							}
						},
						_embedded: {
							cards: [
								{
									id: 304,
									title: "Card 4",
									description: "This is card 4",
									_origin: {
										href: "/test/api/card/304",
										method: "GET"
									},
									_links: {
										self: {
											href: "/test/api/card/304",
											method: "GET"
										},
										move: {
											href: "/test/api/card/304/board/{boardId}/lane/{laneId}",
											method: "PUT",
											templated: true
										},
										block: {
											href: "/test/api/card/304/block",
											method: "PUT"
										}
									}
								}
							]
						}
					},
					{
						id: 202,
						title: "Done",
						wip: 0,
						_origin: {
							href: "/test/api/board/100/lane/202",
							method: "GET"
						},
						_links: {
							self: {
								href: "/test/api/board/100/lane/202",
								method: "GET"
							},
							cards: {
								href: "/test/api/board/100/lane/202/card",
								method: "GET"
							}
						},
						_embedded: {
							cards: [
								{
									id: 305,
									title: "Card 5",
									description: "This is card 5",
									_origin: {
										href: "/test/api/card/305",
										method: "GET"
									},
									_links: {
										self: {
											href: "/test/api/card/305",
											method: "GET"
										},
										move: {
											href: "/test/api/card/305/board/{boardId}/lane/{laneId}",
											method: "PUT",
											templated: true
										},
										block: {
											href: "/test/api/card/305/block",
											method: "PUT"
										}
									}
								},
								{
									id: 306,
									title: "Card 6",
									description: "This is card 6",
									_origin: {
										href: "/test/api/card/306",
										method: "GET"
									},
									_links: {
										self: {
											href: "/test/api/card/306",
											method: "GET"
										},
										move: {
											href: "/test/api/card/306/board/{boardId}/lane/{laneId}",
											method: "PUT",
											templated: true
										},
										block: {
											href: "/test/api/card/306/block",
											method: "PUT"
										}
									}
								}
							]
						}
					}
				]
			}
		};

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

		it( "should be 'quick'", function() {
			elapsedMs.should.be.below( limit );
		} );
	} );

	describe( "when requesting board json version 2", function() {
		var expected = {
			"id": 100,
			"title": "Test Board",
			"description": "This is a board and stuff!",
			"lanes": [
				{
					"id": 200,
					"title": "To Do",
					"wip": 0,
					"cards": [
						{
							"id": 301,
							"title": "Card 1",
							"description": "This is card 1"
						},
						{
							"id": 302,
							"title": "Card 2",
							"description": "This is card 2"
						},
						{
							"id": 303,
							"title": "Card 3",
							"description": "This is card 3"
						}
					]
				},
				{
					"id": 201,
					"title": "Doing",
					"wip": 0,
					"cards": [
						{
							"id": 304,
							"title": "Card 4",
							"description": "This is card 4"
						}
					]
				},
				{
					"id": 202,
					"title": "Done",
					"wip": 0,
					"cards": [
						{
							"id": 305,
							"title": "Card 5",
							"description": "This is card 5"
						},
						{
							"id": 306,
							"title": "Card 6",
							"description": "This is card 6"
						}
					]
				}
			]
		};
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

		it( "should be 'quick'", function() {
			elapsedMs.should.be.below( limit );
		} );
	} );

	describe( "when requesting board hal with no version specifier", function() {

		var body, contentType, elapsedMs;

		var expectedJson = {
			id: 100,
			title: "Test Board",
			_origin: {
				href: "/test/api/board/100",
				method: "GET"
			},
			_links: {
				self: {
					href: "/test/api/board/100",
					method: "GET"
				},
				cards: {
					href: "/test/api/board/100/card",
					method: "GET"
				}
			},
			_embedded: {
				lanes: [ 
					{ 
						id: 200,
						title: "To Do",
						wip: 0,
						_origin: {
							href: "/test/api/board/100/lane/200",
							method: "GET"
						},
						_links: {
							self: {
								href: "/test/api/board/100/lane/200",
								method: "GET"
							},
							cards: {
								href: "/test/api/board/100/lane/200/card",
								method: "GET"
							}
						},
						_embedded: {
							cards: [ 
								{ 
									id: 301,
									title: "Card 1",
									description: "This is card 1",
									_origin: {
										href: "/test/api/card/301",
										method: "GET"
									},
									_links: {
										self: {
											href: "/test/api/card/301",
											method: "GET"
										},
										move: {
											href: "/test/api/card/301/board/{boardId}/lane/{laneId}",
											method: "PUT",
											templated: true
										},
										block: {
											href: "/test/api/card/301/block",
											method: "PUT"
										}
									}
								},
								{
									id: 302,
									title: "Card 2",
									description: "This is card 2",
									_origin: {
										href: "/test/api/card/302",
										method: "GET"
									},
									_links: {
										self: {
											href: "/test/api/card/302",
											method: "GET"
										},
										move: {
											href: "/test/api/card/302/board/{boardId}/lane/{laneId}",
											method: "PUT",
											templated: true
										},
										block: {
											href: "/test/api/card/302/block",
											method: "PUT"
										}
									}
								},
								{
									id: 303,
									title: "Card 3",
									description: "This is card 3",
									_origin: {
										href: "/test/api/card/303",
										method: "GET"
									},
									_links: {
										self: {
											href: "/test/api/card/303",
											method: "GET"
										},
										move: {
											href: "/test/api/card/303/board/{boardId}/lane/{laneId}",
											method: "PUT",
											templated: true
										},
										block: {
											href: "/test/api/card/303/block",
											method: "PUT"
										}
									}
								} 
							]
						}
					},
					{
						id: 201,
						title: "Doing",
						wip: 0,
						_origin: {
							href: "/test/api/board/100/lane/201",
							method: "GET"
						},
						_links: {
							self: {
								href: "/test/api/board/100/lane/201",
								method: "GET"
							},
							cards: {
								href: "/test/api/board/100/lane/201/card",
								method: "GET"
							}
						},
						_embedded: {
							cards: [
								{
									id: 304,
									title: "Card 4",
									description: "This is card 4",
									_origin: {
										href: "/test/api/card/304",
										method: "GET"
									},
									_links: {
										self: {
											href: "/test/api/card/304",
											method: "GET"
										},
										move: {
											href: "/test/api/card/304/board/{boardId}/lane/{laneId}",
											method: "PUT",
											templated: true
										},
										block: {
											href: "/test/api/card/304/block",
											method: "PUT"
										}
									}
								}
							]
						}
					},
					{
						id: 202,
						title: "Done",
						wip: 0,
						_origin: {
							href: "/test/api/board/100/lane/202",
							method: "GET"
						},
						_links: {
							self: {
								href: "/test/api/board/100/lane/202",
								method: "GET"
							},
							cards: {
								href: "/test/api/board/100/lane/202/card",
								method: "GET"
							}
						},
						_embedded: {
							cards: [
								{
									id: 305,
									title: "Card 5",
									description: "This is card 5",
									_origin: {
										href: "/test/api/card/305",
										method: "GET"
									},
									_links: {
										self: {
											href: "/test/api/card/305",
											method: "GET"
										},
										move: {
											href: "/test/api/card/305/board/{boardId}/lane/{laneId}",
											method: "PUT",
											templated: true
										},
										block: {
											href: "/test/api/card/305/block",
											method: "PUT"
										}
									}
								},
								{
									id: 306,
									title: "Card 6",
									description: "This is card 6",
									_origin: {
										href: "/test/api/card/306",
										method: "GET"
									},
									_links: {
										self: {
											href: "/test/api/card/306",
											method: "GET"
										},
										move: {
											href: "/test/api/card/306/board/{boardId}/lane/{laneId}",
											method: "PUT",
											templated: true
										},
										block: {
											href: "/test/api/card/306/block",
											method: "PUT"
										}
									}
								}
							]
						}
					}
				]
			}
		};

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

		it( "should be 'quick'", function() {
			elapsedMs.should.be.below( limit );
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

		it( "should be 'quick'", function() {
			elapsedMs.should.be.below( limit );
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

		var expectedLane = {
			id: 201,
			title: "Doing",
			wip: 0,
			_origin: {
					href: "/test/api/board/100/lane/201",
					method: "GET"
			},
			_links: {
					self: {
							href: "/test/api/board/100/lane/201",
							method: "GET"
					},
					cards: {
							href: "/test/api/board/100/lane/201/card",
							method: "GET"
					}
			},
			_embedded: {
				cards: [
					{
						id: 304,
						title: "Card 4",
						description: "This is card 4",
						_origin: {
								href: "/test/api/card/304",
								method: "GET"
						},
						_links: {
								self: {
										href: "/test/api/card/304",
										method: "GET"
								},
								move: {
										href: "/test/api/card/304/board/{boardId}/lane/{laneId}",
										method: "PUT",
										templated: true
								},
								block: {
										href: "/test/api/card/304/block",
										method: "PUT"
								}
						}
					}
				]
			}
		};

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

		var expected = { 
			_origin: { href: "/test/api/board/100/card", method: "GET" },
			cards: [ 
				{ 
					id: 301,
					title: "Card 1",
					description: "This is card 1",
					_origin: { href: "/test/api/card/301", method: "GET" },
					_links: { 
						self: { href: "/test/api/card/301", method: "GET" },
						move: { href: "/test/api/card/301/board/{boardId}/lane/{laneId}", method: "PUT", templated: true },
						block: { href: "/test/api/card/301/block", method: "PUT" } 
					}
				},
				{
					id: 302,
					title: "Card 2",
					description: "This is card 2",
					_origin: { href: "/test/api/card/302", method: "GET" },
					_links: { 
						self: { href: "/test/api/card/302", method: "GET" },
						move: { href: "/test/api/card/302/board/{boardId}/lane/{laneId}", method: "PUT", templated: true },
						block: { href: "/test/api/card/302/block", method: "PUT" } 
					}
				},
				{
					id: 303,
					title: "Card 3",
					description: "This is card 3",
					_origin: { href: "/test/api/card/303", method: "GET" },
					_links: { 
						self: { href: "/test/api/card/303", method: "GET" },
						move: { href: "/test/api/card/303/board/{boardId}/lane/{laneId}", method: "PUT", templated: true },
						block: { href: "/test/api/card/303/block", method: "PUT" } 
					}
				},
				{
					id: 304,
					title: "Card 4",
					description: "This is card 4",
					_origin: { href: "/test/api/card/304", method: "GET" },
					_links: {
						self: { href: "/test/api/card/304", method: "GET" },
						move: { href: "/test/api/card/304/board/{boardId}/lane/{laneId}", method: "PUT", templated: true },
						block: { href: "/test/api/card/304/block", method: "PUT" }
					}
				},
				{
					id: 305,
					title: "Card 5",
					description: "This is card 5",
					_origin: { href: "/test/api/card/305", method: "GET" },
					_links: { 
						self: { href: "/test/api/card/305", method: "GET" },
						move: { href: "/test/api/card/305/board/{boardId}/lane/{laneId}", method: "PUT", templated: true },
						block: { href: "/test/api/card/305/block", method: "PUT" } 
					} 
				},
				{
					id: 306,
					title: "Card 6",
					description: "This is card 6",
					_origin: { href: "/test/api/card/306", method: "GET" },
					_links: {
							self: { href: "/test/api/card/306", method: "GET" },
							move: { href: "/test/api/card/306/board/{boardId}/lane/{laneId}", method: "PUT", templated: true },
							block: { href: "/test/api/card/306/block", method: "PUT" } 
						} 
					} 
			] 
		};

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

		it( "should be 'quick'", function() {
			elapsedMs.should.be.below( limit );
		} );
	} );

	describe( "when hitting root with options verb", function() {
		var body, contentType, elapsedMs;

		var expectedOptions = {
			_links: 
			 { 
				"_autohost:api": { href: "/test/api/_autohost", method: "GET" },
				"_autohost:resources": { href: "/test/api/_autohost/resource", method: "GET" },
				"_autohost:actions": { href: "/test/api/_autohost/action", method: "GET" },
				"_autohost:connected-sockets": { href: "/test/api/_autohost/sockets", method: "GET" },
				"_autohost:list-users": { href: "/test/api/_autohost/user", method: "GET" },
				"_autohost:list-roles": { href: "/test/api/_autohost/role", method: "GET" },
				"_autohost:list-user-roles": { href: "/test/api/_autohost/user/{user}/role", method: "GET", templated: true },
				"_autohost:list-action-roles": { href: "/test/api/_autohost/action/{action}/role", method: "GET", templated: true },
				"_autohost:add-action-roles":  { href: "/test/api/_autohost/action/{action}/role", method: "PATCH", templated: true },
				"_autohost:remove-action-roles": { href: "/test/api/_autohost/action/{action}/role", method: "DELETE", templated: true },
				"_autohost:add-user-roles": { href: "/test/api/_autohost/user/{user}/role", method: "PATCH", templated: true },
				"_autohost:remove-user-roles":  { href: "/test/api/_autohost/user/{user}/role", method: "DELETE", templated: true },
				"_autohost:add-role": { href: "/test/api/_autohost/role/{role}", method: "POST", templated: true },
				"_autohost:remove-role": { href: "/test/api/_autohost/role/{role}", method: "DELETE", templated: true },
				"_autohost:create-user": { href: "/test/api/_autohost/user/{userName}", method: "POST", templated: true },
				"_autohost:change-password": { href: "/test/api/_autohost/user/{userName}", method: "PATCH", templated: true },
				"_autohost:create-token": { href: "/test/api/_autohost/token", method: "POST" },
				"_autohost:destroy-token": { href: "/test/api/_autohost/token/{token}", method: "DELETE", templated: true },
				"_autohost:list-tokens": { href: "/test/api/_autohost/token/", method: "GET" },
				"_autohost:enable-user": { href: "/test/api/_autohost/user/{userName}", method: "PUT", templated: true },
				"_autohost:disable-user": { href: "/test/api/_autohost/user/{userName}", method: "DELETE", templated: true },
				"_autohost:metrics": { href: "/test/api/_autohost/metrics", method: "GET" },
				"board:cards": { href: "/test/api/board/{id}/card", method: "GET", templated: true },
				"board:self": { href: "/test/api/board/{id}", method: "GET", templated: true },
				"card:self": { href: "/test/api/card/{id}", method: "GET", templated: true },
				"card:move": { href: "/test/api/card/{id}/board/{boardId}/lane/{laneId}", method: "PUT", templated: true },
				"card:block": { href: "/test/api/card/{id}/block", method: "PUT", templated: true },
				"lane:self": { href: "/test/api/board/{boardId}/lane/{id}", method: "GET", templated: true },
				"lane:cards": { href: "/test/api/board/{boardId}/lane/{id}/card", method: "GET", templated: true }
			},
			_mediaTypes: [ "application/json", "application/hal+json" ],
			_versions: [ "1", "2" ]
		};

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
			json.should.eql( expectedOptions );
		} );

		it( "should be 'quick'", function() {
			elapsedMs.should.be.below( limit );
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
		var expected = {"id":100,"title":"Test Board","description":"This is a board and stuff!","lanes":[{"id":200,"title":"To Do","wip":0,"cards":[{"id":301,"title":"Card 1","description":"This is card 1"},{"id":302,"title":"Card 2","description":"This is card 2"},{"id":303,"title":"Card 3","description":"This is card 3"}]},{"id":201,"title":"Doing","wip":0,"cards":[{"id":304,"title":"Card 4","description":"This is card 4"}]},{"id":202,"title":"Done","wip":0,"cards":[{"id":305,"title":"Card 5","description":"This is card 5"},{"id":306,"title":"Card 6","description":"This is card 6"}]}]};
		var body, contentType;

		before( function( done ) {
			request( "http://localhost:8800/test/api/board/100", function( err, res ) {
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
		autohost.stop();
	} );
} );