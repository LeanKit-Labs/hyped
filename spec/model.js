require( "./setup" );

var card1 = { id: 301, title: "Card 1", description: "This is card 1" };
var card2 = { id: 302, title: "Card 2", description: "This is card 2" };
var card3 = { id: 303, title: "Card 3", description: "This is card 3" };
var card4 = { id: 304, title: "Card 4", description: "This is card 4" };
var card5 = { id: 305, title: "Card 5", description: "This is card 5" };
var card6 = { id: 306, title: "Card 6", description: "This is card 6" };

var lane1 = { id: 200, title: "To Do", wip: 0, cards: [ card1, card2, card3 ] };
var lane2 = { id: 201, title: "Doing", wip: 0, cards: [ card4 ] };
var lane3 = { id: 202, title: "Done", wip: 0, cards: [ card5, card6 ] };

var board1 = {
	id: 100,
	title: "Test Board",
	tags: [ "one", "two", "three" ],
	description: "This is a board and stuff!",
	_hidden: "No one should see this",
	lanes: [ lane1, lane2, lane3 ]
};

var board2 = {
	id: 101,
	title: "Another Test Board",
	description: "This is another board! WHOA!",
	lanes: []
};

function deepCompare( a, b, k, l ) {
	l = l || [];
	if ( b === undefined ) {
		l.push( k + ": " + a + "!==" + b );
	} else if ( _.isObject( a ) || _.isArray( a ) ) {
		_.each( a, function( v, k ) {
			deepCompare( a[ k ], b[ k ], k, l );
		} );
	} else {
		var result = a == b; // jshint ignore:line
		if ( !result ) {
			l.push( k + ": " + a + "!==" + b );
		}
	}
	return l;
}

function compare( a, b ) {
	var diff = [];
	deepCompare( a, b, undefined, diff );
	diff.should.eql( [] );
}

module.exports = {
	board1: board1,
	board2: board2,
	deepCompare: compare
};
