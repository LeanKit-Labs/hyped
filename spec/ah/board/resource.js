var model = require( "../../model.js" );

module.exports = function( host ) {
	return {
		name: "board",
		actions: {
			self: {
				include: [ "id", "title" ],
				method: "get",
				url: "/board/:id",
				embed: {
					lanes: {
						resource: "lane",
						render: "self",
						actions: [ "self", "cards" ]
					}
				},
				handle: function( envelope ) {
					envelope.hyper( model.board1 ).render();
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