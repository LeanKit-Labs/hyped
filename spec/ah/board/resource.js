var model = require( "../../model.js" );
var _ = require( "lodash" );

module.exports = function( host ) {
	return {
		name: "board",
		actions: {
			self: {
				include: [ "id", "title" ],
				method: "get",
				url: "/:id",
				embed: {
					lanes: {
						resource: "lane",
						render: "self",
						actions: [ "self", "cards" ]
					}
				},
				handle: function( envelope ) {
					envelope.hyped( model.board1 ).render();
				}
			},
			cards: {
				method: "get",
				url: "/:id/card",
				render: { resource: "card", action: "self" },
				handle: function( envelope ) {
					var cards = _.reduce( model.board1.lanes, function( acc, lane ) {
						return acc.concat( lane.cards );
					}, [] );
					envelope.hyped( cards ).render();
				}
			}
		},
		versions: {
			2: {
				self: {
					include: [ "id", "title", "description" ]
				}
			}
		}
	};
};
