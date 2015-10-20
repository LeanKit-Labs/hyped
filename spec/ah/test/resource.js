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
			},
			reject: {
				method: "get",
				url: "/reject",
				actions: [],
				hidden: true,
				handle: function() {
					return when.reject( new Error( "Something went wrong" ) );
				}
			}
		}
	};
};
