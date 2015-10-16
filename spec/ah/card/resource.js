var model = require( "../../model.js" );

module.exports = function( host ) {
	return {
		name: "card",
		actions: {
			self: {
				include: [ "id", "title", "description" ],
				url: "/card/:id",
				method: "GET",
				handle: function( envelope ) {
					var cards = _.reduce( model.board1.lanes, function( acc, x ) {
						return acc.concat( x.cards );
					} );
					var card = _.where( cards, { id: parseInt( envelope.data.cardId ) } )[ 0 ];
					return card;
				}
			},
			move: {
				include: [ "id", "laneId" ],
				url: "/card/:id/board/:targetBoardId/lane/:targetLaneId",
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
