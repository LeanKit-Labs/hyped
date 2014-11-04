var should = require( "should" ); // jshint ignore: line
var _ = require( "lodash" );
var when = require( "when" );
var model = require( "./model.js" );
var HyperModel = require( "../src/hyperModel.js" );

var board1 = model.board1;
var board2 = model.board2;
var deepCompare = model.deepCompare;

describe( "without inherited URL", function() {
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
			},
			lanes: {
				method: "get",
				url: "/board/:id/lane"
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
				embed: {
					cards: {
						resource: "card",
						render: "self",
						actions: [ "self", "move", "block" ]
					}
				}
			},
			cards: {
				method: "get",
				url: "/lane/:lane.id/card"
			}
		}
	};

	var cardResource = {
		name: "card",
		actions: {
			self: {
				include: [ "id", "title", "description" ],
				url: "/card/:card.id",
				method: "GET"
			},
			move: {
				include: [ "id", "laneId" ],
				url: "/card/:card.id/board/:boardId/lane/:laneId",
				method: "PUT"
			},
			block: {
				include: [ "id", "laneId" ],
				url: "/card/:card.id/block",
				method: "PUT"
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
			full: { href: "/board/100?embed=lanes,cards,classOfService", method: "GET" },
			lanes: { href: "/board/100/lane", method: "GET" }
		},
		_embedded: {
			lanes: [
				{
					id: 200, title: "To Do", wip: 0,
					_origin: { href: "/board/100/lane/200", method: "GET" },
					_links: {
						self: { href: "/board/100/lane/200", method: "GET" },
						cards: { href: "/board/100/lane/200/card", method: "GET" }
					},
					_embedded: {
						cards: [
							{ id: 301, title: "Card 1", description: "This is card 1",
								_origin: { href: "/card/301", method: "GET" },
								_links: {
									self: { href: "/card/301", method: "GET" },
									move: { href: "/card/301/board/:boardId/lane/:laneId", method: "PUT", templated: true },
									block: { href: "/card/301/block", method: "PUT" },
								}
							},
							{ id: 302, title: "Card 2", description: "This is card 2",
								_origin: { href: "/card/302", method: "GET" },
								_links: {
									self: { href: "/card/302", method: "GET" },
									move: { href: "/card/302/board/:boardId/lane/:laneId", method: "PUT", templated: true },
									block: { href: "/card/302/block", method: "PUT" },
								}
							},
							{ id: 303, title: "Card 3", description: "This is card 3",
								_origin: { href: "/card/303", method: "GET" },
								_links: {
									self: { href: "/card/303", method: "GET" },
									move: { href: "/card/303/board/:boardId/lane/:laneId", method: "PUT", templated: true },
									block: { href: "/card/303/block", method: "PUT" },
								}
							}
						]
					}
				},
				{
					id: 201, title: "Doing", wip: 0,
					_origin: { href: "/board/100/lane/201", method: "GET" },
					_links: {
						self: { href: "/board/100/lane/201", method: "GET" },
						cards: { href: "/board/100/lane/201/card", method: "GET" }
					},
					_embedded: {
						cards: [
							{ id: 304, title: "Card 4", description: "This is card 4",
								_origin: { href: "/card/304", method: "GET" },
								_links: {
									self: { href: "/card/304", method: "GET" },
									move: { href: "/card/304/board/:boardId/lane/:laneId", method: "PUT", templated: true },
									block: { href: "/card/304/block", method: "PUT" },
								}
							}
						]
					}
				},
				{
					id: 202, title: "Done", wip: 0,
					_origin: { href: "/board/100/lane/202", method: "GET" },
					_links: {
						self: { href: "/board/100/lane/202", method: "GET" },
						cards: { href: "/board/100/lane/202/card", method: "GET" }
					},
					_embedded: {
						cards: [
							{ id: 305, title: "Card 5", description: "This is card 5",
								_origin: { href: "/card/305", method: "GET" },
								_links: {
									self: { href: "/card/305", method: "GET" },
									move: { href: "/card/305/board/:boardId/lane/:laneId", method: "PUT", templated: true },
									block: { href: "/card/305/block", method: "PUT" },
								}
							},
							{ id: 306, title: "Card 6", description: "This is card 6",
								_origin: { href: "/card/306", method: "GET" },
								_links: {
									self: { href: "/card/306", method: "GET" },
									move: { href: "/card/306/board/:boardId/lane/:laneId", method: "PUT", templated: true },
									block: { href: "/card/306/block", method: "PUT" },
								}
							}
						]
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
			full: { href: "/board/100?embed=lanes,cards,classOfService", method: "GET" },
			lanes: { href: "/board/100/lane", method: "GET" }
		}
	};

	before( function() {
		var hypermodel = HyperModel( { board: boardResource, lane: laneResource, card: cardResource } );
		self = hypermodel( board1, "board", "self" );
		full = hypermodel( board1, "board", "full" );
	} );

	it( 'should generate self hypermedia object model', function() {
		deepCompare( self, expectedSelf );
	} );

	it( 'should generate full hypermedia object model', function() {
		deepCompare( full, expectedFull );
	} );
} );