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
			2: {}
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

	var options;
	var expectedOptions = {
		board: {
			self: { href: "/board/:id", method: "GET", templated: true },
			full: { href: "/board/:id?embed=lanes,cards,classOfService", method: "GET", templated: true },
			lanes: { href: "/board/:id/lane", method: "GET", templated: true },
		},
		lane: {		
			self: { href: "/board/:id/lane/:lane.id", method: "GET", templated: true },
			cards: { href: "/board/:id/lane/:lane.id/card", method: "GET", templated: true }
		},
		card: {				
			self: { href: "/card/:card.id", method: "GET", templated: true },
			move: { href: "/card/:card.id/board/:boardId/lane/:laneId", method: "PUT", templated: true },
			block: { href: "/card/:card.id/block", method: "PUT", templated: true },
		},
		_mediaTypes: [
			"application/json",
			"application/hal+json"
		],
		_versions: [ 1, 2 ]
	};

	before( function() {
		var hypermodel = HyperModel( { board: boardResource, lane: laneResource, card: cardResource } );
		options = hypermodel( { "application/json": function() {}, "application/hal+json": function() {} } );
	} );

	it( 'should generate options', function() {
		deepCompare( expectedOptions, options );
	} );
} );