require( "../setup" );
var model = require( "../model.js" );
var jsonEngine = require( "../../src/jsonEngine.js" );

describe( "JSON Engine", function() {
	describe( "when rendering json", function() {
	var json;

	var hypermodel = {
		id: 100,
		title: "Test Board",
		stringList: [ "one", "two", "three" ],
		list: [
			{
				id: 1,
				title: "One",
				_links: {},
				_resource: "board",
				_action: "self"
			},
			{
				id: 2,
				title: "Two",
				_links: {},
				_resource: "board",
				_action: "self"
			}
		],
		_origin: { href: "/board/100", method: "GET" },
		_links: {
			self: { href: "/board/100", method: "GET" },
			full: { href: "/board/100?embed=lanes,cards,classOfService", method: "GET" },
			lanes: { href: "/board/100/lane", method: "GET" }
		},
		_embedded: {
			lanes: [
				{
					id: 200, title: "To Do", wip: 0, boardId: 100,
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
									move: { href: "/card/301/board/{boardId}/lane/{laneId}", method: "PUT", templated: true },
									block: { href: "/card/301/block", method: "PUT" }
								}
							},
							{ id: 302, title: "Card 2", description: "This is card 2",
								_origin: { href: "/card/302", method: "GET" },
								_links: {
									self: { href: "/card/302", method: "GET" },
									move: { href: "/card/302/board/{boardId}/lane/{laneId}", method: "PUT", templated: true },
									block: { href: "/card/302/block", method: "PUT" }
								}
							},
							{ id: 303, title: "Card 3", description: "This is card 3",
								_origin: { href: "/card/303", method: "GET" },
								_links: {
									self: { href: "/card/303", method: "GET" },
									move: { href: "/card/303/board/{boardId}/lane/{laneId}", method: "PUT", templated: true },
									block: { href: "/card/303/block", method: "PUT" }
								}
							}
						]
					}
				},
				{
					id: 201, title: "Doing", wip: 0, boardId: 100,
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
									move: { href: "/card/304/board/{boardId}/lane/{laneId}", method: "PUT", templated: true },
									block: { href: "/card/304/block", method: "PUT" }
								}
							}
						]
					}
				},
				{
					id: 202, title: "Done", wip: 0, boardId: 100,
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
									move: { href: "/card/305/board/{boardId}/lane/{laneId}", method: "PUT", templated: true },
									block: { href: "/card/305/block", method: "PUT" }
								}
							},
							{ id: 306, title: "Card 6", description: "This is card 6",
								_origin: { href: "/card/306", method: "GET" },
								_links: {
									self: { href: "/card/306", method: "GET" },
									move: { href: "/card/306/board/{boardId}/lane/{laneId}", method: "PUT", templated: true },
									block: { href: "/card/306/block", method: "PUT" }
								}
							}
						]
					}
				}
			]
		}
	};

	var expected = _.omit( model.board1, "tags", "_hidden", "description" );
	expected.stringList = [ "one", "two", "three" ];
	expected.list = [ { id: 1, title: "One" }, { id: 2, title: "Two" } ];

	before( function() {
		json = jsonEngine( hypermodel );
	} );

	it( "should render simple json", function() {
		json.should.eql( expected );
	} );
} );
} );
