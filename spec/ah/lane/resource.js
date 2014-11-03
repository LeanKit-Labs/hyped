var model = require( "../../model.js" );
var _ = require( "lodash" );

module.exports = function( host ) {
	return {
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
				},
				handle: function( envelope ) {
					envelope
						.hyped( _.where( model.board1.lanes, { id: parseInt( envelope.data.laneId ) } )[ 0 ] )
						.render();
				}
			},
			cards: {
				method: "get",
				url: "/lane/:lane.id/card",
				handle: function( envelope ) {
					envelope
						.hyped( _.where( model.board1.lanes, { id: parseInt( envelope.data.laneId ) } )[ 0 ].cards )
						.resource( "card" )
						.action( "self" )
						.render();
				}
			}
		}
	};
};