module.exports = {
	id: 2,
	parentId: 1,
	title: "child",
	_origin: { href: "/test/api/parent/1/child/2", method: "GET" },
	_resource: "child",
	_action: "self",
	_links: {
		self: { href: "/test/api/parent/1/child/2", method: "GET" }
	},
	_embedded: {
		grandChildren: [
			{ id: 1,
				_origin: { href: "/test/api/parent/1/child/2/grand/1", method: "GET" },
				_resource: "grandChild",
				_action: "self",
				_links: {
					self: { href: "/test/api/parent/1/child/2/grand/1", method: "GET" },
					create: { href: "/test/api/parent/1/child/2/grand", method: "POST" }
				}
			},
			{ id: 2,
				_origin: { href: "/test/api/parent/1/child/2/grand/2", method: "GET" },
				_resource: "grandChild",
				_action: "self",
				_links: {
					self: { href: "/test/api/parent/1/child/2/grand/2", method: "GET" },
					create: { href: "/test/api/parent/1/child/2/grand", method: "POST" }
				}
			},
			{ id: 3,
				_origin: { href: "/test/api/parent/1/child/2/grand/3", method: "GET" },
				_resource: "grandChild",
				_action: "self",
				_links: {
					self: { href: "/test/api/parent/1/child/2/grand/3", method: "GET" },
					create: { href: "/test/api/parent/1/child/2/grand", method: "POST" }
				}
			},
			{ id: 4,
				_origin: { href: "/test/api/parent/1/child/2/grand/4", method: "GET" },
				_resource: "grandChild",
				_action: "self",
				_links: {
					self: { href: "/test/api/parent/1/child/2/grand/4", method: "GET" },
					create: { href: "/test/api/parent/1/child/2/grand", method: "POST" }
				}
			},
			{ id: 5,
				_origin: { href: "/test/api/parent/1/child/2/grand/5", method: "GET" },
				_resource: "grandChild",
				_action: "self",
				_links: {
					self: { href: "/test/api/parent/1/child/2/grand/5", method: "GET" },
					create: { href: "/test/api/parent/1/child/2/grand", method: "POST" }
				}
			}
		]
	}
};