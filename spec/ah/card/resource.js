var model = require( "../../model.js" );
var _ = require( "lodash" );

module.exports = function( host ) {
	return {
		name: "card",
		actions: {
			self: {
				include: [ "id", "title", "description" ],
				url: "/card/:id",
				method: "GET",
				handle: function( envelope ) {
					var cards = _.reduce( model.board1.lanes, function( acc, x ) { return acc.concat( x.cards ); } );
					var card = _.where( cards, { id: parseInt( envelope.data.cardId ) } )[ 0 ];
					envelope.hyped( card ).render();
				}
			},
			move: {
				include: [ "id", "laneId" ],
				url: "/card/:id/board/:board.id/lane/:lane.id",
				method: "PUT"
			},
			block: {
				include: [ "id", "laneId" ],
				url: "/card/:id/block",
				method: "PUT"
			}
		}
	};
};