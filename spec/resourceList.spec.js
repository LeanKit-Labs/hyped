var should = require( "should" ); // jshint ignore: line
var _ = require( "lodash" );
var when = require( "when" );
var model = require( "./model.js" );
var HyperModel = require( "../src/hyperModel.js" );

var board1 = model.board1;
var board2 = model.board2;
var deepCompare = model.deepCompare;

describe( "when rendering a collection of resources", function() {

	var expectedBoards = {
		//metadata could be a thing
		_origin: { href: "/board", method: "GET" },
		boards: [
			{
				"id": 100,
				"title": "Test Board",
				"_origin": {
					"href": "/board",
					"method": "GET"
				},
				"_links": {
					"list": {
						"href": "/board",
						"method": "GET"
					},
					"self": {
						"href": "/board/100",
						"method": "GET"
					},
					"lanes": {
						"href": "/board/100/lane",
						"method": "GET"
					}
				}	
			},
			{
				"id": 101,
				"title": "Another Test Board",
				"_origin": {
					"href": "/board",
					"method": "GET"
				},
				"_links": {
					"list": {
						"href": "/board",
						"method": "GET"
					},
					"self": {
						"href": "/board/101",
						"method": "GET"
					},
					"lanes": {
						"href": "/board/101/lane",
						"method": "GET"
					}
				}	
			}
		]
	};

	var boardResource = {
		name: "board",
		actions: {
			list: {
				method: "get",
				url: "/board",
				include: [ "id", "title" ]
			},
			self: {
				method: "get",
				url: "/board/:id",
				include: [ "id", "title" ],
				embed: {
					lanes: {
						resource: "lane",
						render: "self",
						actions: [ "self", "cards" ]
					}
				}
			},
			lanes: {
				method: "get",
				url: "/board/:id/lane",
				include: [],
				embed: {
					lanes: {
						resource: "lane",
						render: "self",
						actions: [ "self", "cards" ]
					}
				}
			}
		}
	};

	var laneResource = {
		name: "lane",
		parent: "board",
		actions: {
			self: {
				method: "get",
				url: "/lane/:lane.id",
				include: [ "id", "title", "wip" ]
			},
			cards: {
				method: "get",
				url: "/lane/:lane.id/card"
			}
		}
	};

	before( function() {
		var list = [ board1, board2 ];
		var hypermodel = HyperModel( { board: boardResource, lane: laneResource } );
		self = hypermodel( list, "board", "list" );
	} );

	it( 'should generate embedded resource list', function() {
		deepCompare( self, expectedBoards );
	} );

} );