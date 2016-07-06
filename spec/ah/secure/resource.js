module.exports = function() {
	return {
		name: "secure",
		actions: {
			self: {
				method: "get",
				url: "/",
				authorize: function( envelope ) {
					return envelope.data.level ? envelope.data.level > 1 : false;
				},
				handle: function( envelope ) {
					return { data: { result: "level 1" } };
				}
			}
		},
		versions: {
			2: {
				self: {
					authorize: function( envelope ) {
						return envelope.data.level ? envelope.data.level > 2 : false;
					},
					handle: function( envelope ) {
						return { data: { result: "level 2" } };
					}
				}
			}
		}
	};
};
