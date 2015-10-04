module.exports = function() {
	return {
		name: "test",
		actions: {
			self: {
				method: "get",
				url: "/",
				handle: function( envelope ) {
					return { data: envelope.context };
				},
				condition: function( data, context ) {
					return context !== {};
				}
			}
		}
	};
};
