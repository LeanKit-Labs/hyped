var model = require( "../../model.js" );
var _ = require( "lodash" );

module.exports = function( host ) {
	return {
		name: "card",
		actions: {
			self: {
				include: [ "id", "title", "description" ],
				url: "/card/:card.id",
				method: "GET",
				handle: function( envelope ) {
					var cards = _.reduce( model.board1.lanes, function( acc, x ) { return acc.concat( x.cards ); } );
					var card = _.where( cards, { id: envelope.data.cardId } )[ 0 ];
					envelope.hyper( card ).render();
				}
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
};