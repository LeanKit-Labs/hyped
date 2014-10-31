var should = require( "should" ); // jshint ignore: line
var _ = require( "lodash" );
var when = require( "when" );
var model = require( "./model.js" );
var HyperModel = require( "../src/hyperModel.js" );

var board1 = model.board1;
var board2 = model.board2;
var deepCompare = model.deepCompare;

describe( "when fetching options", function() {
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
		},
		versions: {
			2: {
				self: {
					include: [ "id", "title", "description" ]
				},
				full: {
					deleted: true
				}
			},
			3: {
				addLane: {
					method: "post",
					url: "/board/:id/lane"
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
				include: [ "id", "title", "wip" ],
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

	var expectedSelfv1 = {
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

	var expectedFullv1 = {
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

	var expectedSelfv2 = {
		id: 100,
		title: "Test Board",
		description: "This is a board and stuff!",
		_origin: { href: "/board/100", method: "GET" },
		_links: {
			self: { href: "/board/100", method: "GET" },
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

	var expectedSelfv3 = {
		id: 100,
		title: "Test Board",
		description: "This is a board and stuff!",
		_origin: { href: "/board/100", method: "GET" },
		_links: {
			self: { href: "/board/100", method: "GET" },
			lanes: { href: "/board/100/lane", method: "GET" },
			addLane: { href: "/board/100/lane", method: "POST" }
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

	var hypermodelv1, hypermodelv2, hypermodelv3;

	before( function() {
		hypermodelv1 = HyperModel( { board: boardResource, lane: laneResource, card: cardResource } );
		hypermodelv2 = HyperModel( { board: boardResource, lane: laneResource, card: cardResource }, 2 );
		hypermodelv3 = HyperModel( { board: boardResource, lane: laneResource, card: cardResource }, 3 );
		selfv1 = hypermodelv1( board1, "board", "self" );
		selfv2 = hypermodelv2( board1, "board", "self" );
		selfv3 = hypermodelv3( board1, "board", "self" );

		fullv1 = hypermodelv1( board1, "board", "full" );
	} );

	it( "should generate selfv1", function() {
		deepCompare( selfv1, expectedSelfv1 );
	} );

	it( "should generate selfv2", function() {
		deepCompare( selfv2, expectedSelfv2 );
	} );

	it( "should generate selfv3", function() {
		deepCompare( selfv3, expectedSelfv3 );
	} );

	it( "should generate fullv1", function() {
		deepCompare( fullv1, expectedFullv1 );
	} );

	it( "should throw an exception when rendering missing action", function() {
		( function() { hypermodelv3( board1, "board", "full" ); } ).should.throw( "Could not find action 'full' for resource 'board'" );
	} );
} );