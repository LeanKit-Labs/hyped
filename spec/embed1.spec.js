var should = require( "should" ); // jshint ignore: line
var _ = require( "lodash" );
var when = require( "when" );
var model = require( "./model.js" );
var HyperModel = require( "../src/hyperModel.js" );

var board1 = model.board1;
var board2 = model.board2;
var deepCompare = model.deepCompare;

describe( "with inherited URL", function() {
	var boardResource = {
		name: "board",
		actions: {
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
			full: {
				method: "get",
				url: "/board/:id?embed=lanes,cards,classOfService",
				include: [ "id", "title", "description" ]
			}
		}
	};

	var laneResource = {
		parent: "board",
		name: "lane",
		actions: {
			self: {
				method: "get",
				url: "/lane/:id",
				include: [ "id", "title", "wip" ]
			},
			cards: {
				method: "get",
				url: "/lane/:lane.id/card"
			}
		}
	};

	var self, full;
	var expectedSelf = {
		id: 100,
		title: "Test Board",
		_origin: { href: "/board/100", method: "GET" },
		_links: {
			self: { href: "/board/100", method: "GET" },
			full: { href: "/board/100?embed=lanes,cards,classOfService", method: "GET" }
		},
		_embedded: {
			lanes: [
				{
					id: 200, title: "To Do", wip: 0,
					_origin: { href: "/board/100/lane/200", method: "GET" },
					_links: {
						self: { href: "/board/100/lane/200", method: "GET" },
						cards: { href: "/board/100/lane/200/card", method: "GET" }
					}
				},
				{
					id: 201, title: "Doing", wip: 0,
					_origin: { href: "/board/100/lane/201", method: "GET" },
					_links: {
						self: { href: "/board/100/lane/201", method: "GET" },
						cards: { href: "/board/100/lane/201/card", method: "GET" }
					}
				},
				{
					id: 202, title: "Done", wip: 0,
					_origin: { href: "/board/100/lane/202", method: "GET" },
					_links: {
						self: { href: "/board/100/lane/202", method: "GET" },
						cards: { href: "/board/100/lane/202/card", method: "GET" }
					}
				}
			]
		}
	};

	var expectedFull = {
		id: 100,
		title: "Test Board",
		description: "This is a board and stuff!",
		_origin: { href: "/board/100?embed=lanes,cards,classOfService", method: "GET" },
		_links: {
			self: { href: "/board/100", method: "GET" },
			full: { href: "/board/100?embed=lanes,cards,classOfService", method: "GET" }
		}
	};

	before( function() {
		var hypermodel = HyperModel( { board: boardResource, lane: laneResource } );
		self = hypermodel( board1, "board", "self" ).render();
		full = hypermodel( board1, "board", "full" ).render();
	} );

	it( 'should generate self hypermedia object model', function() {
		deepCompare( self, expectedSelf );
	} );

	it( 'should generate full hypermedia object model', function() {
		deepCompare( full, expectedFull );
	} );
} );